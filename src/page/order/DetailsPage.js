/**
 * create at 01/04/19
 */
import React, { Component } from 'react'
import { Card, message, Button, } from 'antd'
import _ from 'lodash'

// presenters
import { orderPresenters } from '../../presenter'

// util
import {commonUtil} from '../../utils'

// style
import './details.less'

// const 
const { fetchOrderDetail } = orderPresenters

class DetailsPage extends Component{
	state = {
		orderInfo: null
	}
	map = null

	componentDidMount(){
		this._requestInfo()
	}

	_requestInfo = async ()=>{
		try{
			// 取路由参数
			const {orderId} = this.props.match.params
			const ret = await fetchOrderDetail({params: {order_id: orderId}})
			if(_.isNil(ret))
				throw new Error(`数据格式不正确`)
			this.setState({
				orderInfo: ret
			})
			this._renderMap()
		}catch(e){
			message.error(`获取订单详情失败 err=${e.message}`)
		}
	}

	// 绘制地图组件
	_renderMap = ()=>{
		try{
			const {position_list, area_list} = this.state.orderInfo
			this.map = new window.BMap.Map('orderDetailMap')
			// 设置地图中心点
			this.map.centerAndZoom('北京', 11)
			this._addMapControl()
			// this._drawBikeRoute({positionList: position_list})
			// this._drawServerArea({areaList: area_list})
		}catch(e){
			// message.error(`绘制地图fail err=${e.message}`)
		}
	}
	// 添加控件
	_addMapControl = ()=>{
		this.map.addControl(new window.BMap.ScaleControl({anchor: window.BMAP_ANCHOR_TOP_RIGHT}))
		this.map.addControl(new window.BMap.NavigationControl({anchor: window.BMAP_ANCHOR_TOP_RIGHT}))
	}
	// 添加路线图
	_drawBikeRoute = ({positionList})=>{
		// 添加起始坐标点
		let startPoint = '', endPoint = ''
		if(_.isArray(positionList) && positionList.length > 0){
			const firstPosition = positionList[0]
			// 起始 坐标 、icon, 坐标依赖marker
			startPoint = new window.BMap.Point(firstPosition.lon, firstPosition.lat)
			let startIcon = new window.BMap.Icon('/assets/start_point.png', new window.BMap.Size(36, 42), {
				imageSize: new window.BMap.Size(36, 42),
				anchor: new window.BMap.Size(18, 42),
			})
			let startMarker = new window.BMap.Marker(startPoint, {icon: startIcon})
			this.map.addOverlay(startMarker)

			// 结束 坐标、icon, 坐标依赖marker
			const lastPosition = positionList[positionList.length-1]
			endPoint = new window.BMap.Point(lastPosition.lon, lastPosition.lat)
			let endIcon = new window.BMap.Icon('/assets/end_point.png', new window.BMap.Size(36, 42), {
				imageSize: new window.BMap.Size(36, 42),
				anchor: new window.BMap.Size(18, 42),
			})
			let endMarker = new window.BMap.Marker(endPoint, {icon: endIcon})
			this.map.addOverlay(endMarker)

			// 连接路线图
			let trackPoint = []
			positionList.forEach((item)=>{
				trackPoint.push(new window.BMap.Point(item.lon, item.lat))
			})
			let polylines = new window.BMap.Polyline(trackPoint, {
				strokeColor: '#1869AD', strokeWeight: 3, strokeOpacity: 1.0
			})
			this.map.addOverlay(polylines)

			// 重新设置 地图中间点坐标
			this.map.centerAndZoom(endPoint, 11)
		}
	}
	// 添加服务区
	_drawServerArea = ({areaList})=>{
		if(_.isArray(areaList) && areaList.length > 0){
			// 连接服务区
			let trackPoint = []
			areaList.forEach((item)=>{
				trackPoint.push(new window.BMap.Point(item.lon, item.lat))
			})
			let polylines = new window.BMap.Polygon(trackPoint, {
				strokeColor: '#CE0000', strokeWeight: 4, strokeOpacity: 1.0, 
				fillColor: '#FF8605', fillOpacity: 0.3
			})
			this.map.addOverlay(polylines)
		}
	}

	_mapSearch = async()=>{
		try{
			let options = {
				renderOptions: {
					map: this.map
				},
				onSearchComplete: function(results){
					console.log('status=>', local.getStatus)
					console.log('results=>', results)
				}
			}
			let local = new window.BMap.LocalSearch(this.map, {
				...options,
			})
			local.search('天津市滨海新区万达广场')
		}catch(e){
			console.log(`e =>`, e)
		}
	}

	render(){
		const info = this.state.orderInfo || {}
		return (
			<div>
				<Card>
					<div id="orderDetailMap" className="order-detail-map"></div>
					<div className="order-detail-items">
						<div className="item-title">地图搜索</div>
						<Button type="primary" onClick={this._mapSearch}>搜索</Button>
					</div>
					<div className="order-detail-items">
						<div className="item-title">基础信息</div>
						<ul className="detail-form">
							<li>
								<div className="detail-form-left">用车模式</div>
								<div className="detail-form-content">{
									info.mode ? (info.mode === 1 ? '服务区' : '停车点') : ''
								}</div>
							</li>
							<li>
								<div className="detail-form-left">订单编号</div>
								<div className="detail-form-content">{
									info.order_code ? info.order_code : ''
								}</div>
							</li>
							<li>
								<div className="detail-form-left">车辆编号</div>
								<div className="detail-form-content">{
									info.bike_code ? info.bike_code : ''
								}</div>
							</li>
							<li>
								<div className="detail-form-left">用户姓名</div>
								<div className="detail-form-content">{
									info.user_name ? info.user_name : ''
								}</div>
							</li>
						</ul>
					</div>
					<div className="order-detail-items">
						<div className="item-title">行驶轨迹</div>
						<ul className="detail-form">
							<li>
								<div className="detail-form-left">行程起点</div>
								<div className="detail-form-content">{
									info.start_location ? info.start_location : ''
								}</div>
							</li>
							<li>
								<div className="detail-form-left">行程终点</div>
								<div className="detail-form-content">{
									info.end_location ? info.end_location : ''
								}</div>
							</li>
							<li>
								<div className="detail-form-left">行程里程</div>
								<div className="detail-form-content">{
									info.distance ? commonUtil.translateDistance(info.distance) : ''
								}</div>
							</li>
						</ul>
					</div>
				</Card>
			</div>
		)
	}
}

export default DetailsPage