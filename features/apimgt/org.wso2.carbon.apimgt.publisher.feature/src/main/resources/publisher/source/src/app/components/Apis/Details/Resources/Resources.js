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

import React from 'react'
import {  Icon, Checkbox, Button, Card, Tag, Form } from 'antd';
import { Row, Col } from 'antd';
import Api from '../../../../data/api'
import Resource from './Resource'
import Loading from '../../../Base/Loading/Loading'
import ApiPermissionValidation from '../../../../data/ApiPermissionValidation'
import Select from 'material-ui/Select';
import {MenuItem} from 'material-ui/Menu';
const CheckboxGroup = Checkbox.Group;
import Input, {InputLabel} from 'material-ui/Input';

class Resources extends React.Component{
    constructor(props){
        super(props);
        this.state ={
            tmpMethods:[],
            tmpResourceName: '',
            paths:{},
            swagger:{},
            scopes:[]
        };
        this.api = new Api();
        this.api_uuid = props.match.params.api_uuid;
        this.addResources = this.addResources.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onChangeInput = this.onChangeInput.bind(this);
        this.updatePath = this.updatePath.bind(this);
        this.updateResources = this.updateResources.bind(this);
        this.handleScopeChange = this.handleScopeChange.bind(this);

    }
    handleScopeChange(e) {
        this.setState({scopes: e.target.value});
        this.handleScopeChangeInSwaggerRoot(e.target.value);

    }
    handleScopeChangeInSwaggerRoot(scopes){
        let swagger = this.state.swagger;
        if (swagger.security){
            swagger.security.map(function(object, i){
                if(object.OAuth2Security){
                    object.OAuth2Security = scopes;
                }
            });
        } else{
            swagger.security = [{"OAuth2Security":scopes}];
        }
            this.setState({swagger:swagger});
        }


    componentDidMount() {

        const api = new Api();
        let promised_api_object = api.get(this.api_uuid);
        promised_api_object.then(
            response => {
                this.setState({api: response.obj});
            }
        ).catch(
            error => {
                if (process.env.NODE_ENV !== "production") {
                    console.log(error);
                }
                let status = error.status;
                if (status === 404) {
                    this.setState({notFound: true});
                }
            }
        );
        let promised_scopes_object = api.getScopes(this.api_uuid);
        promised_scopes_object.then(
            response => {
                this.setState({apiScopes: response.obj});
            }
        ).catch(
            error => {
                if (process.env.NODE_ENV !== "production") {
                    console.error(error);
                }
                let status = error.status;
                if (status === 404) {
                    this.setState({notFound: true});
                }
            }
        );

        let promised_api = this.api.getSwagger(this.api_uuid);
        promised_api.then((response) => {
            let tempScopes = [];
            if(response.obj.security && response.obj.security.length!== 0){
                response.obj.security.map(function(object, i){
                    if(object.OAuth2Security){
                        tempScopes =  object.OAuth2Security;
                    }
                });
            }
            this.setState({swagger: response.obj, scopes: tempScopes});

            if(response.obj.paths !== undefined ){
                this.setState({paths:response.obj.paths})
            }
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

    onChange(checkedValues) {
        this.setState({tmpMethods:checkedValues});
    }
    onChangeInput(e) {
        let value = e.target.value;
        if(value.indexOf("/") === -1 ){
            value = "/" + value;
        }
        this.setState({tmpResourceName:value});
    }
    addResources(){
        const defaultGet =  {
            description:'description',
            produces:'application/xml,application/json',
            consumes:'application/xml,application/json',
            parameters:[],
            responses: {
                200: {
                    "description": ""
                }
            }
        };

        const defaultPost =  {
            description: 'description',
            produces: 'application/xml,application/json',
            consumes: 'application/xml,application/json',
            responses: {
                200: {
                    "description": ""
                }
            },
            parameters: [
                {
                    name: "Payload",
                    description: "Request Body",
                    required: false,
                    in: "body",
                    schema: {
                        type: "object",
                        properties: {
                            payload: {
                                type: "string"
                            }
                        }
                    }
                }
            ]
        };

        const defaultDelete =  {
            description: 'description',
            produces: 'application/xml,application/json',
            responses: {
                200: {
                    "description": ""
                }
            },
            parameters: []
        };
        const defaultHead =  {
            responses: {
                200: {
                    "description": ""
                }
            },
            parameters: []
        };

        let pathValue = {};

        this.state.tmpMethods.map( (method ) => {
            switch (method) {
                case "GET" :
                    pathValue["GET"] = defaultGet;
                    break;
                case "POST" :
                    pathValue["POST"] = defaultPost;
                    break;
                case "PUT" :
                    pathValue["PUT"] = defaultPost;
                    break;
                case "PATCH" :
                    pathValue["PATCH"] = defaultPost;
                    break;
                case "DELETE" :
                    pathValue["DELETE"] = defaultDelete;
                    break;
                case "HEAD" :
                    pathValue["HEAD"] = defaultHead;
                    break;
            }
        });

        let tmpPaths = this.state.paths;
        tmpPaths[this.state.tmpResourceName] = pathValue;
        this.setState({paths:tmpPaths});
    }
    updatePath(path,method,value) {
        let tmpPaths = this.state.paths;
        if(value === null){
            delete tmpPaths[path][method];
        } else{
            tmpPaths[path][method] = value;
        }
        this.setState({paths:tmpPaths});
    }
    updateResources(){
        let tmpSwagger = this.state.swagger;
        tmpSwagger.paths = this.state.paths;
        this.setState({api:tmpSwagger});
        let promised_api = this.api.updateSwagger(this.api_uuid, this.state.swagger);
        promised_api.then((response) => {
            console.info(response);
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
    render(){
        if (!this.state.api) {
            return <Loading/>
        }
        const selectBefore = (
            <span>/SwaggerPetstore/1.0.0</span>
        );
        const plainOptions = ['GET','POST','PUT','DELETE','PATCH','HEAD','OPTIONS'];
        let paths = this.state.paths;
        return (
            <div>
                <h2>Resources</h2>
                <Card title="Add Resource For Path" style={{ width: "100%",marginBottom:20 }}>
                    <Row type="flex" justify="start">
                        <Col span={4}>URL Pattern</Col>
                        <Col span={20}>
                            <Input onChange={this.onChangeInput}  defaultValue="" />
                            <div style={{marginTop:20}}>
                                <CheckboxGroup options={plainOptions}  onChange={this.onChange} />
                            </div>
                            <div style={{marginTop:20}}>
                                <Button type="primary"  onClick={this.addResources}>Add Resources to Path</Button>
                            </div>
                        </Col>
                    </Row>
                </Card>
                {this.state.apiScopes ? <Card title="Assign Global Scopes for API" style={{ width: "100%",marginBottom:20 }}>
                    <Row type="flex" justify="start">
                        <Col span={20}>
                            <Select
                                margin="none"
                                multiple
                                value={this.state.scopes}
                                onChange={this.handleScopeChange}
                                MenuProps={{
                                    PaperProps: {
                                        style: {
                                            width: 200,
                                        },
                                    },
                                }}>
                                {this.state.apiScopes.list.map(tempScope => (
                                    <MenuItem
                                        key={tempScope.name}
                                        value={tempScope.name}
                                        style={{
                                            fontWeight: this.state.scopes.indexOf(tempScope.name) !== -1 ? '500' : '400',
                                        }}
                                    >
                                        {tempScope.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Col>
                    </Row>
                </Card>: null}
                {
                    Object.keys(paths).map(
                        (key) => {
                            let path = paths[key];
                            let that = this;
                            return (
                                Object.keys(path).map( (innerKey) => {
                                    return <Resource path={key} method={innerKey} methodData={path[innerKey]} updatePath={that.updatePath} apiScopes={this.state.apiScopes}/>
                                })
                            );


                        }
                    )
                }
                <ApiPermissionValidation userPermissions={this.state.api.userPermissionsForApi}>
                    <input type="button" onClick={this.updateResources} value="Save"/>
                </ApiPermissionValidation>

            </div>
        )
    }
}

export default Resources