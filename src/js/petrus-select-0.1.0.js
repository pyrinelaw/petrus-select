/**
 * @author  Petrus.Law (petrus.law@outlook.com)
 * @date    2014-09-09 16:10:10
 * @desc    下拉框插件，支持手机端
 * @github	https://github.com/pyrinelaw/
 * @version	0.1.0
 */

(function() {
	var zIndex = 1;				// 设置zIndex，解决多个petrus_select之间层级问题

	// 默认选项
	var defaultOptions = {
		width: NaN,				// 自定义宽度，不定义随外部容器而变化
		styleName: 'blue',		// 样式名,blue对应样式为petrus-blue-select, (blue、white、pink、green、grey、black)
		title: '请选择',			// 标题
		backText: 'BACK',		// 返回字体
		$container: null,		// 容器
		selected: [],			// 当前选中
		data: {},				// 数据，格式如:{k1: [v1, v2], k2: ...}
		callbacks: {
			init: null,			// 初始化完成回调
			titClicked: null,	// 点击标题回调
			change: null		// 选中分类改变回调
		}
	}

	// 初始选项
	var initOptions = {
		spreadStatus: 0	// 展开状态，0:未展开，1:catList展开,2:subList 展开
	}

	var Attrs = {
		/**
		 * 初始化
		 */
		initialize: function() {
			var $container = this.$container,
				$el = this.$el = $('<div class="petrus-select petrus-'+this.styleName+'-select"></div>');

			if(this.width) $el.width(this.width);	// 自定义宽度

			if($container) $container.append($el);

			this.renderTit();

			if(this.getCatLen() == 0) return;	// 无分类

			this.renderCat();
			this.renderSub();

			if(this.callbacks.init) this.callbacks.init();

			zIndex++;	// 避免多个控件层级问题，后加入控件层级总是比前一控件优先级大1

			return true;
		},

		/**
		 * 渲染按钮
		 */
		renderTit: function() {
			var $titWrap = this.$titWrap;

			if(!$titWrap) {
				$titWrap = this.$titWrap = $('<div class="petrus-select-tit"></div>');
				this.$el.append($titWrap);

				var _this = this;

				$titWrap.click(function(){
					_this.titClicked();
				});

				if(this.getCatLen() > 0) {
					var $arrow = $('<div class="petrus-select-tit-arrow"></div>');
					$titWrap.append($arrow);
				}

				this.$tit = $('<span></span>');

				$titWrap.append(this.$tit);
			}

			this.$tit.html(this.selected[1] || this.selected[0] || this.title);
		},

		/**
		 * 渲染分类列表
		 */
		renderCat: function() {
			var $catWrap = this.$catWrap;

			// 抽次进入
			if(!$catWrap){
				$catWrap = this.$catWrap = $('<div class="petrus-select-list-wrap" ></div>');
				this.$el.append($catWrap);

				var _this = this;

				$catWrap.delegate(".petrus-select-option","click", function(e){
					var $cat = $(e.target);
					_this.changeCat(_this.getCatByIdx($cat.index()));
				});

				return;
			}

			$catWrap.css('z-index', zIndex);

			$catWrap.empty();

			var data = this.data;

			for(var k in data){
				this.create$cat(k);
			}
		},

		/**
		 * 渲染子类列表
		 */
		renderSub: function() {
			if(!this.selected || !this.selected[0] || this.selected[0].length == 0) return;

			var $subWrap = this.$subWrap;

			if(!$subWrap) {
				$subWrap = this.$subWrap = $('<div class="petrus-select-list-wrap"></div>');
				this.$el.append($subWrap);

				var _this = this;

				$subWrap.delegate('.sub', 'click', function(e) {
					var $sub = $(e.target),
						idx = $sub.index();

					_this.changeSub(_this.data[_this.selected[0]][idx-1]);
				});

				return;
			}

			$subWrap.css('z-index', zIndex);
			zIndex++;

			$subWrap.empty();

			this.createBack();

			var data = this.data;

			for(k in data[this.selected[0]]) {
				this.create$sub(data[this.selected[0]][k]);
			}
		},

		/**
		 * 重置子分类列表
		 * @param {[Boolean]} isLeave 是否保留子元素
		 */
		reset$cat: function(isLeave) {
			$catWrap = this.$catWrap;

			$catWrap.removeClass('petrus-select-list-wrap-up');
			$catWrap.removeClass('petrus-select-list-wrap-down');
			$catWrap.removeClass('petrus-select-list-wrap-turn-hide');
			$catWrap.removeClass('petrus-select-list-wrap-turn-show');

			if(!isLeave) this.$catWrap.empty();
		},

		/**
		 * 重置子分类列表
		 * @param {[Boolean]} isLeave 是否保留子元素
		 */
		reset$sub: function(isLeave) {
			var $subWrap = this.$subWrap;

			$subWrap.removeClass('petrus-select-list-wrap-up')
			$subWrap.removeClass('petrus-select-list-wrap-down');
			$subWrap.removeClass('petrus-select-list-wrap-move-show');
			$subWrap.removeClass('petrus-select-list-wrap-move-hide');

			if(!isLeave) $subWrap.empty();

		},

		/**
		 * 创建分类选项
		 */
		create$cat: function(cat) {
			var $catWrap = this.$catWrap,
				$cat = $('<div class="petrus-select-option">'+cat+'</div>');

			if(this.selected[0] == cat) $cat.addClass('selected');

			if(this.data[cat] && this.data[cat].length > 0){
				var $arrow = $( '<div class="petrus-select-option-arrow"></div>');
				$cat.append($arrow);
			}

			$catWrap.append($cat);

		},

		/**
		 * 创建子分类选项
		 */
		create$sub: function(sub) {
			var $subWrap = this.$subWrap,
				$sub = $('<div class="petrus-select-option sub">'+sub+'</div>');

			if(this.selected[1] == sub) $sub.addClass('selected');

			$subWrap.append($sub);

		},

		/**
		 * 创建返回选项
		 */
		createBack: function() {
			var $back = $('<div class="petrus-select-option back">'+this.backText+'</div>'),
				$arrow = $('<div class="petrus-select-option-arrow back"></div>');

			$back.append($arrow);

			var _this = this;

			$back.click(function(event) {
				_this.onBack();
			});

			this.$subWrap.append($back);
		},

		/**
		 * 标题点击回调
		 */
		titClicked: function(){
			// 当前未展开，且无选中子项
			if(this.spreadStatus == 0 && this.selected.length < 2){
				this.catWrapUp();
			}
			// 当前已展开，且无选中子项
			else if(this.spreadStatus == 1 && this.selected.length < 2){
				this.catWrapDown();
			}
			// 当前未展开，存在选中子项
			if(this.spreadStatus == 0 && this.selected.length == 2){
				this.subWrapUp();
			}
			// 当前已展开，选中子项
			else if(this.spreadStatus == 2){
				this.subWrapDown();
			}
			if(this.callbacks.titClicked){
				this.callbacks.titClicked.call(null, this.selected);
			}
		},

		/**
		 * 触发返回事件
		 */
		onBack: function(){
			this.subWrapHide();
		},

		setSpreadStatus: function(status) {
			this.spreadStatus = status;
		},

		equalCat: function(cat){
			if( (!cat && !this.selected[0]) || (cat && cat == this.selected[0]) ) return true;

			return false;
		},

		/**
		 * 改变选择分类
		 * @param {[String]} cat 分类名
		 */
		changeCat: function(cat) {
			// 该分类下不存在子分类
			if(!this.data[cat] || this.data[cat].length == 0) {
				if(!this.equalCat(cat)){
					this.setSelected([cat]);
				}
				this.catWrapDown();
			}
			// 该分类下存在子分类
			else if(this.data[cat].length > 0) {
				if(!this.equalCat(cat)){
					this.setSelected([cat]);
				}
				this.subWrapShow();
			}
		},

		/**
		 * 改变选择子分类
		 * @param {[String]} sub 子分类名
		 */
		changeSub: function(sub){
			this.setSelected([this.selected[0], sub]);

			this.subWrapDown();
		},

		/**
		 * 设置选中数据
		 * @param {[Array]} selected 选择数据
		 */
		setSelected: function(selected) {
			selected = selected || [];

			if(this.selected.length != selected.length || this.selected[0] != this.selected[0] || this.selected[0] != this.selected[1]) {
				this.selected = selected;
				this.renderTit();

				if(this.callbacks.change) this.callbacks.change.call(null, this.selected);
			}
		},

		/**
		 * 根据下标获取分类
		 * @param {[Number]} idx 下标
		 * @return {[String]} key 分类名
		 */
		getCatByIdx: function(idx) {
			var i=0;

			for(var key in this.data){
				if(i==idx) return key;
				i++;
			}

			return null;
		},

		/**
		 * 获取分类长度
		 */
		getCatLen: function() {
			var len = 0;

			for(var key in this.data) {
				len++;
			}

			return len;
		},

		/**
		 * 分类列表Up方式显示
		 * 查看up样式
		 */
		catWrapUp: function(){
			this.setSpreadStatus(1);

			var _this = this;

			this.renderCat();

			_this.$catWrap.addClass('petrus-select-list-wrap-up');
		},

		catWrapDown: function(){
			this.setSpreadStatus(0);

			this.reset$cat(true);

			this.$catWrap.addClass('petrus-select-list-wrap-down');

			var _this = this;

			setTimeout(function() {
				_this.reset$cat();
			}, 300);
		},

		subWrapShow: function() {
			this.setSpreadStatus(2);

			this.renderSub();

			this.$catWrap.addClass('petrus-select-list-wrap-turn-hide');

			var _this = this;

			setTimeout(function() {
				_this.reset$cat();
			}, 300);

			this.renderSub();

			this.$subWrap.addClass('petrus-select-list-wrap-move-show');
		},

		subWrapHide: function() {
			this.setSpreadStatus(1);

			this.$subWrap.addClass('petrus-select-list-wrap-move-hide');

			var _this = this;

			setTimeout(function() {
				_this.reset$sub();
			}, 300);

			this.renderCat();

			this.$catWrap.addClass('petrus-select-list-wrap-turn-show');
		},

		subWrapUp: function(){
			this.setSpreadStatus(2);

			this.renderSub();

			this.$subWrap.addClass('petrus-select-list-wrap-up');
		},

		subWrapDown: function(){
			this.setSpreadStatus(0);

			this.reset$sub(true);

			this.$subWrap.addClass('petrus-select-list-wrap-down');

			var _this = this;

			setTimeout(function() {
				_this.reset$sub();
			}, 300);
		}
	}

	var petrus_select = function(settings) {
		settings = settings || {};

		$.extend(true, this, defaultOptions, initOptions, settings);

		$.extend(true, this, Attrs);

		this.initialize();

		return {
			selected: this.selected
		}

		return this;
	}

	$.petrus_select = function(settings) {
		return new petrus_select(settings);
	}

	$.fn.petrus_select = function(settings) {
		settings = settings || {};
		settings.$container = $(this);
		return $.petrus_select(settings);
	}

})()
