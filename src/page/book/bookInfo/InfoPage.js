/**
 * create at 12/28/18
 */
import React, { Component } from 'react'
import { Card, message, Button, Modal, } from 'antd'
import _ from 'lodash'
import moment from 'moment'

// components
import { CommonTable } from '../../../components'
import { BookForm } from './components'

// presenter
import { bookPresenters } from '../../../presenter'

// util
import { tableUtil } from '../../../utils'

// const 
import { columnConst, } from './constants'

const { calculateTableWidth, tablePagination, } = tableUtil
const { 
	fetchBookCategorys, fetchbookAll, fetchAddBook,
	fetchUpdateBook, fetchRemoveBook, 
} = bookPresenters

const ADD = 'options_add'
const EDIT = 'options_edit'
const DELETE = 'options_delete'

class ApiContainer extends Component{
	state = {
		booksSource: [],
		bookRowkeys: [],
		bookRows: [],
		pagination: null,
		showModal: false,
	}
	colWidth = calculateTableWidth(columnConst)
	modalTitle = ''
	childrenCategorys = []
	bookForm = ''
	editType = ''
	page = {
		page_size: 10,
		page: 1,
	}

	componentDidMount(){
		this._requestBookInfoList()
		this._requestCategoryData()
	}

	_requestBookInfoList = async ()=>{
		try{
			const _this = this
			let bookBody = {
				page: {
					...this.page,
				}
			}
			const bookRet = await fetchbookAll({body: bookBody})
			if(_.isNil(bookRet))
				throw new Error('数据格式不正确')
			this.setState({
				booksSource: _.isArray(bookRet.list) ? bookRet.list : [],
				bookRowkeys: [],
				bookRows: [],
				pagination: tablePagination({...this.page, total: bookRet.sum}, (current)=>{
					
					_this.page = {
						..._this.page,
						page: current,
					}
					// refresh
					_this._requestBookInfoList()
				})
			})
		}catch(e){
			message.error(`获取图书列表失败 err=${e.message}`)
		}
	}

	_requestCategoryData = async ()=>{
		try{
			const categoryRet = await fetchBookCategorys({body: {type: 2}})
			if(!_.isArray(categoryRet))
				throw new Error('数据格式不正确')
			this.childrenCategorys = categoryRet
		}catch(e){
			message.error(`获取图书分类fail err=${e.message}`)
		}
	}

	_bookEdit = (type)=>{
		const { bookRowkeys, bookRows } = this.state
		if(type !== ADD && bookRowkeys.length <= 0){
			message.warn(`请至少选择一条图书信息进行编辑`)
			return
		}
		// 处理删除
		if(type === DELETE && bookRows.length > 0){
			const {author = '', book_name = ''} = bookRows[0]
			Modal.confirm({
				title: '提示',
				content: `确定移除图书 书名《${book_name}》作者:${author}`,
				onCancel: ()=> null,
				onOk: this._bookDeleteRequest
			})
			return
		}
		this.modalTitle = type === ADD ? `创建图书信息` : `编辑图书信息`
		this.editType = type
		this.setState({
			showModal: true
		})
	}

	_modalOK = ()=>{
		const {validateFields, resetFields} = this.bookForm.props.form
		validateFields((err, values)=>{
			if(!err){
				// 请求数据
				const newValues = _.cloneDeep(values) 
				// 处理 pubdates
				const {pubdate} = newValues
				newValues.pubdate = !_.isNil(pubdate) ? moment(pubdate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
				
				const retBool = this._bookEditRequest({data: newValues, type: this.editType})
				if(!retBool)
					return  
				this.setState({
					showModal: false
				})
				// book edit type 置为默认
				this.editType = ''
				// form clear
				resetFields()
				// 刷新book list
				this._requestBookInfoList()
			}
		})
	}
	_modalCancel = ()=>{
		const {resetFields} = this.bookForm.props.form
		// form clear
		resetFields()
		this.setState({
			showModal: false
		})
	}
	_bookEditRequest = async ({data, type})=>{
		try{
			if(type === ADD){
				// 添加图书
				const ret = await fetchAddBook({body: {...data}})
				if(_.isNil(ret)){
					throw new Error('添加图书 获取请求结果失败')
				}
				message.success(`添加图书成功`)
				return true
			}
			// 修改图书信息
			const { bookRowkeys } = this.state
			let updateBody = {
				...data,
				book_id: (_.isArray(bookRowkeys) && bookRowkeys.length >0) ? bookRowkeys[0] : null
			}
			const retUpdate = await fetchUpdateBook({body: updateBody})
			if(_.isNil(retUpdate)){
				throw new Error('修改图书 获取请求结果失败')
			}
			message.success(`修改图书信息成功`)
			return true
		}catch(e){
			message.error(`操作失败 err=${e.message}`)
			return false
		}
	}
	_bookDeleteRequest = async ()=>{
		try{
			const { bookRowkeys } = this.state
			let body = {
				book_id: (_.isArray(bookRowkeys) && bookRowkeys.length > 0) ? bookRowkeys[0] : null 
			}
			const ret = await fetchRemoveBook({body})
			if(_.isNil(ret))
				throw new Error('数据格式错误')
			message.success(`移除图书信息成功`)
			await this._requestBookInfoList()
		}catch(e){
			message.error(`移除图书失败 err=${e.message}`)
		}
	}

	render(){
		const bookColumns = _.cloneDeep(columnConst)
		const { 
			booksSource, bookRowkeys, bookRows, pagination, showModal,
		} = this.state
		return (
			<div>
				<Card >
					<span>图书信息</span>
					<Button style={{marginLeft: 20}} type="primary" icon="plus" 
						onClick={()=> this._bookEdit(ADD)}
					>增加</Button>
					<Button style={{marginLeft: 20}} type="default" icon="edit" 
						onClick={()=> this._bookEdit(EDIT)}
					>修改</Button>
					<Button style={{marginLeft: 20}} type="danger" icon="delete"
						onClick={()=> this._bookEdit(DELETE)}
					>移除</Button>
				</Card>
				<div className="content-wrap">
					<CommonTable 
						columns={bookColumns}
						dataSource={booksSource}
						scroll={{x: this.colWidth, y: 600}}
						pagination={pagination}
						rowSelection='radio'
						selectedRowKeys={bookRowkeys}
						selectedRows={bookRows}
						updateSelectedItem={(selectedRowKeys, selectedRows)=>{
							this.setState({
								bookRowkeys: selectedRowKeys,
								bookRows: selectedRows,
							})
						}}
					/>
				</div>
				<Modal visible={showModal} 
					title={this.modalTitle}
					onOk={this._modalOK}
					onCancel={this._modalCancel}
				>
					<BookForm bookCategorys={this.childrenCategorys} 
						formData={(this.editType === EDIT && bookRows.length > 0) ? bookRows[0] : null}
						wrappedComponentRef={(form)=> this.bookForm = form}
					/>
				</Modal>
			</div>
		)
	}
}

export default ApiContainer