/*
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import Button from 'material-ui/Button';
import Application from '../../../data/Application'

import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import {withStyles} from 'material-ui/styles';
import PropTypes from 'prop-types';
import Table, {TableCell, TableHead, TableRow, TableSortLabel} from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import AddIcon from 'material-ui-icons/Add';
import Loading from "../../Base/Loading/Loading";
import AppsTableContent from "./AppsTableContent";
import Tooltip from 'material-ui/Tooltip';
import Alert from "../../Base/Alert";
import qs from 'qs';

const styles = theme => ({
    fab: {
        position:'fixed',
        float: 'right',
        right: theme.spacing.unit * 3,
        bottom: theme.spacing.unit * 6,
    },
});

class ApplicationTableHead extends Component {
    static propTypes = {
        onRequestSort: PropTypes.func.isRequired,
        order: PropTypes.string.isRequired,
        orderBy: PropTypes.string.isRequired,
    };

    createSortHandler = property => event => {
        this.props.onRequestSort(event, property);
    };

    render() {
        const columnData = [
            {id: 'name', numeric: false, disablePadding: true, label: 'Name'},
            {id: 'throttlingTier', numeric: false, disablePadding: false, label: 'Tier'},
            {id: 'lifeCycleStatus', numeric: false, disablePadding: false, label: 'Workflow Status'},
            {id: 'actions', numeric: false, disablePadding: false, label: 'Actions'},
        ];
        const {order, orderBy} = this.props;
        return (
            <TableHead>
                <TableRow>
                    {columnData.map(column => {
                        return (
                            <TableCell key={column.id} numeric={column.numeric}>
                                <TableSortLabel
                                    active={orderBy === column.id}
                                    direction={order}
                                    onClick={this.createSortHandler(column.id)}
                                >
                                    {column.label}
                                </TableSortLabel>
                            </TableCell>
                        );
                    })}
                </TableRow>
            </TableHead>
        );
    }
}

class Listing extends Component {

    constructor(props) {
        super(props);
        this.state = {
            order: 'asc',
            orderBy: 'name',
            selected: [],
            data: null,
            alertMessage: null,
        };
        this.handleAppDelete = this.handleAppDelete.bind(this);
    }

    componentDidMount() {
        let promised_applications = Application.all();
        promised_applications.then((applications) => {
            let apps = new Map(); // Applications list put into map, to make it efficient when deleting apps (referring back to an App)
            applications.list.map(app => apps.set(app.applicationId, app)); // Store application against its UUID
            this.setState({data: apps});
        }).catch(error => {
            if (process.env.NODE_ENV !== "production")
                console.log(error);
            let status = error.status;
            if (status === 404) {
                this.setState({notFound: true});
            } else if (status === 401) {
                this.setState({isAuthorize: false});
                let params = qs.stringify({reference: this.props.location.pathname});
                this.props.history.push({pathname: "/login", search: params});
            }
        });
    }

    handleRequestSort = (event, property) => {
        const orderBy = property;
        let order = 'desc';
        if (this.state.orderBy === property && this.state.order === 'desc') {
            order = 'asc';
        }
        const data = this.state.data.sort(
            (a, b) => (order === 'desc' ? b[orderBy] > a[orderBy] : a[orderBy] > b[orderBy]),
        );
        this.setState({data, order, orderBy});
    };

    handleAppDelete(event) {
        const id = event.currentTarget.getAttribute('data-appId');
        let app = this.state.data.get(id);
        app.deleting = true;
        this.state.data.set(id, app);
        this.setState({data: this.state.data});

        const message = "Application: " + app.name + " deleted successfully!";
        let promised_delete = Application.deleteApp(id);
        promised_delete.then(ok => {
            if (ok) {
                this.state.data.delete(id);
                this.setState({data: this.state.data, alertMessage: message});
            }
        });
    }

    render() {
        const {data, order, orderBy, alertMessage} = this.state;
        if (!data) {
            return <Loading/>;
        }
        const {classes} = this.props;
        return (
            <div>
                {alertMessage && <Alert message={alertMessage}/>}
                <Grid className="full-width" container justify="center" alignItems="center">
                    <Grid item xs={12} sm={12} md={8} lg={8} xl={8} >
                        <Typography type="title" gutterBottom className="page-title">
                            Applications
                        </Typography>

                        <Typography type="caption" gutterBottom className="page-title">
                            An application is a logical collection of APIs. Applications allow you to use a
                            single
                            access
                            token to invoke a collection of APIs and to subscribe to one API multiple times with
                            different
                            SLA levels. The DefaultApplication is pre-created and allows unlimited access by
                            default.
                        </Typography>
                        <Paper>
                            {data.size > 0 ? (
                                <Table>
                                    <ApplicationTableHead order={order} orderBy={orderBy}
                                                          onRequestSort={this.handleRequestSort}/>
                                    <AppsTableContent handleAppDelete={this.handleAppDelete} apps={data}/>
                                </Table>
                            ) : (
                                <Grid container justify="center" alignItems="center">
                                    <Grid item xs={8}>
                                        <Typography type="display1" className="page-title">
                                            No Applications.
                                        </Typography>
                                    </Grid>
                                </Grid>
                            )}
                        </Paper>
                        <Link to={"/application/create"}>
                            <Tooltip title="Create Application" placement="bottom" aria-label="Create Application">
                                <Button fab color="primary" className={classes.fab} aria-label="add" >
                                    <AddIcon />
                                </Button>
                            </Tooltip>
                        </Link>
                    </Grid>
                </Grid>
            </div>
        );
    }
}

export default withStyles(styles)(Listing);
