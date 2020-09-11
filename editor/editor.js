/**
 * Editor de texto built-in
 * Rev 5021
 * 
 * @author Sergio
 * 
 * para utilizar basta importar o arquivo editor.js 
 * criar uma div com altura, largura e com um id
 * instanciar a classe TextEditor passando como parâmetro o id da div criada
 * 
 * no HTML
 * <div id="divContainer" style="width: 400px; height: 200px;"></div>
 * 
 * no Javascript
 * <code>
 * 	new TextEditor("divContainer");
 * </code>
 */
/**
 * @extends Abstract.TimedObserver
 */
Form.Element.EditAreaObserver = Class.create(Abstract.TimedObserver, {
	getValue: function() {
		return this.element.body.innerHTML;
	}
});
/**
 * Wrapper para recuperar o texto selecionado
 * @class WrapperTextRange
 */
var WrapperTextRange = Class.create();
WrapperTextRange.prototype = {
	
	/**
	 * @type HTMLIFrameElement
	 */
	iframe: null,
	/**
	 * @type HTMLDocument
	 */
	iframeDocument: null,
	/**
	 * @type TextEditor
	 */
	textEditorInstance: null,
	/**
	 * @type TextRange
	 */
	range: null,
	/**
	 * @constructor
	 * @param {TextEditor} textEditor
	 */
	initialize: function(textEditor){
		this.textEditorInstance = textEditor;
		var editArea = textEditor.getEditArea();
		this.iframe = editArea;
		var iframeDocument = this.iframe.contentWindow.document;
		this.iframeDocument = iframeDocument;
		if(iframeDocument.selection){
			this.range = iframeDocument.selection.createRange();  //store to restore later(IE fix)
		}
	},
	/**
	 * Retorna o texto selecionado sem formatação
	 * @return texto sem formatação
	 * @type String
	 */
	getSelectedText: function(){
		var iframe_win = this.iframe.contentWindow;

		if(iframe_win.getSelection)	
			return iframe_win.getSelection().toString();

		this.range.select(); //Restore selection, if IE lost focus.
		return iframe_win.document.selection.createRange().text;
	},
	/**
	 * Retorna o html selecionado
	 * @return html da seleção
	 * @type String
	 */
	getSelectedHTML: function(){
		var html = null;
		var iframe_window = this.iframe.contentWindow;
		var rng	= this.getSelectionRange();

		if(rng) {
			if(iframe_window.getSelection) {
				var e = document.createElement('div');
				e.appendChild(rng.cloneContents());
				html = e.innerHTML;		
			} else {
				html = rng.htmlText;
			}
		}

		return html;	
	},
	/**
	 * 
	 * @return o elemento selecionado
	 * @type HTMLElement
	 */
	getSelectedElement: function(){
		var node, selection, range;
		var iframe_win	= this.iframe.contentWindow;
		
		if (iframe_win.getSelection) {
			try {
				selection = iframe_win.getSelection();
				range = selection.getRangeAt(0);
				node = range.commonAncestorContainer;
			} catch(e){
				return false;
			}
		} else {
			try {
				selection = iframe_win.document.selection;
				range = selection.createRange();
				node = range.parentElement();
			} catch (e) {
				return false;
			}
		}

		return node;	
	},
	/**
	 * retorna o objeto range que representa a seleção
	 * @return o objeto range de acordo com o navegador
	 * @type Object
	 */
	getSelectionRange: function(){
		var rng	= null;
		var iframe_window = this.iframe.contentWindow;
		this.iframe.focus();
		
		if(iframe_window.getSelection) {
			rng = iframe_window.getSelection().getRangeAt(0);
			if(Prototype.Browser.Opera) { //v9.63 tested only
				var s = rng.startContainer;
				if(s.nodeType === Node.TEXT_NODE){
					rng.setStartBefore(s.parentNode);
				}
			}
		} else {
			this.range.select(); //Restore selection, if IE lost focus.
			rng = this.iframeDocument.selection.createRange();
		}

		return rng;
	},
	/**
	 * Apaga o texto selecionado
	 * @return
	 */
	apagarTexto: function(){
		this.selectionReplaceWith("");
	},
	/**
	 * Substitui o texto selecionado pelo html passado
	 * @param {String} html
	 * @return
	 */
	selectionReplaceWith: function(html){
		var rng	= this.getSelectionRange();
		var iframe_window = this.iframe.contentWindow;

		if(!rng)
			return;
		this.textEditorInstance.executarComando("removeFormat");// we must remove formating or we will get empty format tags!
		

		if(iframe_window.getSelection) {
			rng.deleteContents();
			rng.insertNode(rng.createContextualFragment(html));
			this.textEditorInstance.executarComando("delete");
		} else {
			this.textEditorInstance.executarComando("delete");
			rng.pasteHTML(html);
		}
	}
};
/**
 * @class UtilTextEditor
 */
var UtilTextEditor = {
	/**
	 * Estilo dos botões do texteditor
	 * @type String
	 */
	ESTILO_BOTOES: "border: 1px solid rgb(144, 186, 237); width: 100px; background-color: #ECF6FF;font-weight: bold; color:#7A7A7A; cursor:pointer;",
	/**
	 * @param {String} titulo
	 * @param {Number} height
	 * @param {Number} width
	 * @param {Function} functionConfirm
	 * @param {Function} functionCancel
	 * @param {TextEditor} textEditor
	 * 
	 * @return div que representará o conteúdo que será adicionado pela função chamadora
	 * @type HTMLDivElement
	 */
	getJanelaPadrao: function(titulo, height, width, functionConfirm, functionCancel, textEditor){
		var divContainer = textEditor.divContainer;
		/**
		 * @type HTMLInputElement
		 */
		var botaoConfirm = Builder.node("input", {
			type: "button", 
			value: "OK", 
			id:"ok", 
			title: "Confirmar ação", 
			style: this.ESTILO_BOTOES
		});
		/**
		 * @type HTMLInputElement
		 */
		var botaoCancel = Builder.node("input", {
			type: "button", 
			value: "Cancelar", 
			id: "cancelar", 
			title: "Cancelar ação", 
			style: this.ESTILO_BOTOES
		});
		Event.observe(botaoConfirm, "click", functionConfirm);
		Event.observe(botaoCancel, "click", functionCancel);
		
		var divTitulo = this.getDivTitulo(titulo);
		/**
		 * @type HTMLDivElement
		 */
		var div = Builder.node("div", {style: "position: absolute;" +
												"top:40px; " +
												"left: 10px; " +
												"width: "+width+"px; " +
												"border: 1px solid #808080; " +
												"background-color: #FBFDFF; " +
												"padding: 2px;", id: "divJanela"});
		var divConteudo = $(Builder.node("div", {style: "background-color: white;border: 1px solid #808080; padding: 5px;margin: 3px;"}));
		div.appendChild(divTitulo);
		div.appendChild(divConteudo);
		div.setOpacity(0.9);
		div.appendChild(Builder.node("div", {style: "text-align: center;"}, [
			botaoConfirm,
			document.createTextNode(" "),
			botaoCancel
		]));
		divContainer.appendChild(div);
		divContainer.makePositioned();
		return divConteudo;
	},
	/**
	 * Arrastador
	 * @type Draggable
	 */
	draggable: null,
	/**
	 * Buscar pelo div principal, pois que deverá ser arrastado
	 * @param {HTMLSpanElement} elementoInicial
	 * @return
	 */
	getDivCampo: function(elementoInicial){
		while(!(elementoInicial.id == "divJanela")){
			elementoInicial = elementoInicial.parentNode;
		}
		return elementoInicial;
	},
	/**
	 * Iniciar evento de arrastar janelinha
	 * @param {Event} event
	 * @return
	 */
	iniciarDrag: function(event){
		if(this.draggable == null){
			var element = event.element();
			element.setStyle({cursor: "move"});
			var divPrincipal = this.getDivCampo(element);
			this.draggable = new Draggable(divPrincipal);
			this.draggable.initDrag(event);
		}
	},
	/**
	 * Finalizar arrasto da janela
	 * @param {Event} event
	 * @return
	 */
	finalizarDrag: function(event){
		var element = event.element();
		var divPrincipal = this.getDivCampo(element);
		
		element.setStyle({cursor: "default"});
		if(this.draggable != null){
			try{
				this.draggable.finishDrag(event);
			}catch (e) {
				//nothing
			}
			this.draggable.destroy();
			this.draggable = null;
		}
	},
	/**
	 * Cria o span de título
	 * @param {String} titulo
	 * @return span criado e configurado
	 * @type HTMLSpanElement
	 */
	getSpanTitulo: function(titulo){
		var spanTituloReal=Builder.node("span", {UNSELECTABLE: "on", style: "cursor: default; padding-bottom: 4px; padding-top:1px;"}, 
			[document.createTextNode(titulo)]
		);
		return spanTituloReal;
	},
	/**
	 * Retorna a div de título da janela
	 * @param {String} titulo
	 * @return div criado
	 * @type HTMLDivElement
	 */
	getDivTitulo: function(titulo){
		var divTitulo = Builder.node("div", {style: "cursor:default; " +
													"font-weight: bold;" +
													"color: #003366;" +
													"height: 17px; " +
													"font-size: 11px;" +
													"background-color: #dde8f3;" +
													"padding-left:5px;"});
		
		var spanTituloReal = this.getSpanTitulo(titulo); 
		
		
		divTitulo.appendChild(Builder.node("div", {style: "float:left; margin-right: 7px;"}, [
			spanTituloReal
		]));

		divTitulo.onselectstart = function(){
			return false;
		};
		Event.observe(divTitulo, "mousedown", this.iniciarDrag.bindAsEventListener(this));
		Event.observe(divTitulo, "mouseup", this.finalizarDrag.bindAsEventListener(this));

		return divTitulo;
	},
	/**
	 * @type Template
	 */
	templateSessoes: new Template("overflow: auto; " +
									"height: 90px; " +
									"border: 1px solid blue;" +
									"background-attachment: scroll;" +
									"background-position: center center; " +
									"background-repeat: no-repeat; " +
									"background-image: url(\"#{imagem}\");"),
	/**
	 * Estilo das sessões
	 * @param {String}imagem
	 * @return o estilo a ser aplicado 
	 * @type String
	 */
	getEstiloSessao: function(imagem){
		var src = imagem;
		return this.templateSessoes.evaluate({imagem: src});
	}
};
/**
 * Remover formatação
 */
var ToolOutdent = Class.create();
ToolOutdent.prototype = {
	/**
	 * @type TextEditor
	 */
	textEditorInstance: null,
	/**
	 * @constructor
	 * 
	 * @param {TextEditor} textEditor
	 * @return
	 */
	initialize: function(textEditor){
		this.textEditorInstance = textEditor;
	},
	/**
	 * Aplicar um novo tamanho ao texto selecionado
	 */
	aplicarFormatacao: function(){
		var range = new WrapperTextRange(this.textEditorInstance);
		var element = range.getSelectedElement();
		while(element != null && element.id != "indentacao"){
			element = element.parentNode;
		}
		if(element == null){
			return;
		}
		/**
		 * @type HTMLElement
		 */
		var appendElement = element.parentNode;
		/**
		 * @type HTMLDivElement
		 */
		var elementoRemovido = Element.remove(element);
		$A(elementoRemovido.childNodes).each(function(childElement){
			appendElement.appendChild(childElement);
		});
	}
};
/**
 * Indentação
 */
var ToolIndent = Class.create();
ToolIndent.prototype = {
	/**
	 * @type TextEditor
	 */
	textEditorInstance: null,
	/**
	 * @constructor
	 * 
	 * @param {TextEditor} textEditor
	 * @return
	 */
	initialize: function(textEditor){
		this.textEditorInstance = textEditor;
	},
	/**
	 * Aplicar um novo tamanho ao texto selecionado
	 */
	aplicarFormatacao: function(){
		var range = new WrapperTextRange(this.textEditorInstance);
		var htmlSelecionado = range.getSelectedHTML();
		range.selectionReplaceWith("<div style=\"text-indent: 60px;\" id=\"indentacao\">"+htmlSelecionado+"</div>");
	}
};
/**
 * @class ToolTamanhoFonte
 */
var ToolTamanhoFonte = Class.create();
ToolTamanhoFonte.prototype = {
	/**
	 * @type TextEditor
	 */
	textEditorInstance: null,
	/**
	 * @constructor
	 * 
	 * @param {TextEditor} textEditor
	 * @return
	 */
	initialize: function(textEditor){
		this.textEditorInstance = textEditor;
	},
	/**
	 * Construir combo para seleção de um novo tamanho para aplicar ao texto selecionado
	 * @return o select com as opções de tamanho de fonte
	 * @type HTMLSelectElement
	 */
	getElementoTela: function(){
		var opcoes = new Array();
		opcoes.push(Builder.node("option", {value: ""}, [document.createTextNode("- tamanho -")]));
		opcoes.push(Builder.node("option", {value: "1"}, [document.createTextNode("1 (8pt)")]));
		opcoes.push(Builder.node("option", {value: "2"}, [document.createTextNode("2 (10pt)")]));
		opcoes.push(Builder.node("option", {value: "3", selected: "selected"}, [document.createTextNode("3 (12pt)")]));
		opcoes.push(Builder.node("option", {value: "4"}, [document.createTextNode("4 (14pt)")]));
		opcoes.push(Builder.node("option", {value: "5"}, [document.createTextNode("5 (16pt)")]));
		opcoes.push(Builder.node("option", {value: "6"}, [document.createTextNode("6 (18pt)")]));
		opcoes.push(Builder.node("option", {value: "7"}, [document.createTextNode("7 (20pt)")]));
		
		/**
		 * @type HTMLSelectElement
		 */
		var select = Builder.node("select", {title: "Tamanho do texto selecionado", style: "height: 15px; margin-left: 5px; font-size: 8px;"}, opcoes);
		select.selectedIndex = 3;
		Event.observe(select, "change", this.aplicarFormatacao.bindAsEventListener(this));
		return select;
	},
	/**
	 * Aplicar um novo tamanho ao texto selecionado
	 * @param {Event} event
	 */
	aplicarFormatacao: function(event){
		var select = Event.element(event);
		var tamanho = $(select).getValue();
		this.textEditorInstance.executarComando("fontsize", parseInt(tamanho));
	}
};
/**
 * @class ToolColor
 */
var ToolColor = Class.create();
ToolColor.prototype = {
	/**
	 * @type TextEditor
	 */
	textEditorInstance: null,
	/**
	 * @constructor
	 * 
	 * @param {TextEditor} textEditor
	 * @return
	 */
	initialize: function(textEditor){
		this.textEditorInstance = textEditor;
	},
	/**
	 * Gerar combo para trocar a cor do texto selecionado
	 * @return botao
	 * @type HTMLDivElement
	 */
	getElementoTela: function(){
		var resto = "height: 10px;width:10px; float:left; border: solid 1px black; margin: 2px; cursor: pointer; ";
		var titulo = new Template("Mudar a cor do texto selecionado para #{c}");
		var cores = new Array();
		cores.push("#000000");
		cores.push("#993300");
		cores.push("#333300");
		cores.push("#003300");
		cores.push("#003366");
		cores.push("#000080");
		cores.push("#333399");
		cores.push("#333333");
		cores.push("#800000");
		cores.push("#FF6600");
		cores.push("#808000");
		cores.push("#008080");
		cores.push("#0000FF");
		cores.push("#666699");
		cores.push("#808080");
		cores.push("#FF0000");
		cores.push("#FF9900");
		cores.push("#99CC00");
		cores.push("#339966");
		cores.push("#33CCCC");
		cores.push("#3366FF");
		cores.push("#800080");
		cores.push("#999999");
		cores.push("#FF00FF");
		cores.push("#FFCC00");
		cores.push("#FFFF00");
		cores.push("#00FF00");
		cores.push("#F5E1C7");
		cores.push("#00FFFF");
		cores.push("#00CCFF");
		cores.push("#993366");
		cores.push("#C0C0C0");
		cores.push("#FF99CC");
		cores.push("#FFCC99");
		cores.push("#FFFF99");
		cores.push("#CCFFCC");
		cores.push("#CCFFFF");
		cores.push("#99CCFF");
		cores.push("#CC99FF");
		cores.push("#FFFFFF");
		
		
		var divColors = new Array();
		cores.each(function(cor){
			var estilo = "background-color: "+cor+";"+resto;
			divColors.push(Builder.node("div", {style: estilo, UNSELECTABLE: "on", title: titulo.evaluate({c: cor})}, [document.createTextNode(" ")]));
		});
		var estiloDivCor = "position:absolute; width: 128px; margin-left: 10px; float: left;display:none; background-color:#F3F3F3; border: 1px solid gray; padding: 3px;";
		/**
		 * @type HTMLDivElement
		 */
		var divCor = Builder.node("div", {style: estiloDivCor}, divColors);
		$(divCor).childElements().each((function(div){
			Event.observe(div, "click", this.aplicarFormatacao.bindAsEventListener(this));
		}).bind(this));
		this.textEditorInstance.barraFerramentas.appendChild(divCor);
		
		var imagem = this.textEditorInstance.getImageToolBar("fontcolor.gif");
		Event.observe(imagem, "click", this.mostrarCores.bind(this, divCor));
		var tituloBotao = "cor do texto";
		imagem.alt = tituloBotao;
		imagem.title = tituloBotao;
		imagem.firstChild.height = "14";
		imagem.firstChild.width = "21";
		
		
		new PeriodicalExecuter(function(pe){
			divCor.style.marginTop = "16px";
			divCor.style.left = (Prototype.Browser.IE? (imagem.offsetLeft+2): (imagem.offsetLeft-11))+ "px";
			pe.stop();
		}, 1.0);
		return imagem;
	},
	/**
	 * Aplicar uma cor ao texto selecionado
	 * @param {Event} event
	 */
	aplicarFormatacao: function(event){
		var div = Event.element(event);
		var cor = div.style.backgroundColor;
		this.textEditorInstance.executarComando("foreColor", cor);
		this.mostrarCores();
	},
	/**
	 * Div container das cores
	 * @type HTMLDivElement
	 */
	divCor: null,
	/**
	 * Mostrar todas as cores
	 * @param {HTMLDivElement} divCor
	 */
	mostrarCores: function(divCor){
		if(divCor == undefined){
			divCor = this.divCor;
		}
		divCor.toggle();
		this.divCor = divCor;
	}
};
/**
 * @class ToolFormatacao
 */
var ToolFormatacao = Class.create();
ToolFormatacao.prototype = {
	/**
	 * @type TextEditor
	 */
	textEditorInstance: null,
	/**
	 * @constructor
	 * 
	 * @param {TextEditor} textEditor
	 * @return
	 */
	initialize: function(textEditor){
		this.textEditorInstance = textEditor;
	},
	/**
	 * Construir o combo para seleção de um novo formato de fonte para aplicar ao texto selecionado
	 * @return o select criado para escolher a fonte
	 * @type HTMLSelectElement
	 */
	getElementoTela: function(){
		/**
		 * @type HTMLSelectElement
		 */
		var select = Builder.node("select", {title: "Tipo da fonte do texto selecionado", style: "height: 15px; margin-left: 5px; font-size: 8px;"}, [
			Builder.node("option", {value: ""}, [document.createTextNode("- fonte -")]),
			Builder.node("option", {value: "Arial"}, [document.createTextNode("Arial")]),
			Builder.node("option", {value: "Verdana"}, [document.createTextNode("Verdana")]),
			Builder.node("option", {value: "Times New Roman", selected: "selected"}, [document.createTextNode("Times New Roman")]),
			Builder.node("option", {value: "Courier New"}, [document.createTextNode("Courier New")]),
			Builder.node("option", {value: "Comic Sans MS"}, [document.createTextNode("Comic Sans MS")]),
			Builder.node("option", {value: "georgia"}, [document.createTextNode("Georgia")]),
			Builder.node("option", {value: "impact"}, [document.createTextNode("Impact")]),
			Builder.node("option", {value: "trebuchet ms"}, [document.createTextNode("Trebuchet MS")]),
			Builder.node("option", {value: "helvetica"}, [document.createTextNode("Helvetica")])
		]);
		select.selectedIndex = 3;
		Event.observe(select, "change", this.aplicarFormatacao.bindAsEventListener(this));
		return select;
	},
	/**
	 * aplicar novo formato de fonte ao texto selecionado
	 * @param {Event} event
	 */
	aplicarFormatacao: function(event){
		var select = Event.element(event);
		var fonte = $(select).getValue();
		if(!fonte.blank()){
			this.textEditorInstance.executarComando("fontname", fonte);
		}
	}
};
/**
 * @class ToolAlignBottom
 */
var ToolAlignBottom = Class.create();
ToolAlignBottom.prototype = {
	/**
	 * @type TextEditor
	 */
	textEditorInstance: null,
	/**
	 * @constructor
	 * 
	 * @param {TextEditor} textEditor
	 * @return
	 */
	initialize: function(textEditor){
		this.textEditorInstance = textEditor;
	},
	/**
	 * Rodapé do documento
	 * @type HTMLDivElement
	 */
	footer: null,
	/**
	 * jogar o texto selcionado para o rodapé
	 */
	aplicarFormatacao: function(){
		var range = new WrapperTextRange(this.textEditorInstance);
		var naoEncontrado = range.getSelectedHTML();
		if(naoEncontrado.blank()){
			return;
		}
		range.apagarTexto();
		var footerId = "footer";
		this.footer = this.textEditorInstance.getElementByIdEditArea(footerId);
		if(this.footer == null){
			var image = this.textEditorInstance.getBasePathImagens("footer.png");
			this.footer = Builder.node("div", {style: UtilTextEditor.getEstiloSessao(image), title: "Rodapé do texto", id: footerId});
			this.textEditorInstance.iframeDocument.body.appendChild(this.footer);
		}
		this.footer.innerHTML = this.footer.innerHTML+naoEncontrado;
	}
};

/**
 * @class ToolAlignTop
 */
var ToolAlignTop = Class.create();
ToolAlignTop.prototype = {
	/**
	 * @type TextEditor
	 */
	textEditorInstance: null,
	/**
	 * @constructor
	 * 
	 * @param {TextEditor} textEditor
	 * @return
	 */
	initialize: function(textEditor){
		this.textEditorInstance = textEditor;
	},
	/**
	 * Cabeçalho do documento
	 * @type HTMLDivElement
	 */
	header: null,
	/**
	 * colocar o texto selecionado no cabeçalho do documento 
	 */
	aplicarFormatacao: function(){
		var range = new WrapperTextRange(this.textEditorInstance);
		var naoEncontrado = range.getSelectedHTML();
		if(naoEncontrado.blank()){
			return;
		}
		range.apagarTexto();
		var headerID = "header";
		this.header = this.textEditorInstance.getElementByIdEditArea(headerID);
		if(this.header == null){
			var image = this.textEditorInstance.getBasePathImagens("header.png");
			this.header = Builder.node("div", {style: UtilTextEditor.getEstiloSessao(image), title: "Cabeçalho do texto",id: headerID});
			var firstChild = this.textEditorInstance.iframeDocument.body.firstChild;
			if(firstChild == null){
				this.textEditorInstance.iframeDocument.body.appendChild(this.header);
			}else{
				Element.insert(firstChild, {before: this.header});
			}
		}
		this.header.innerHTML = this.header.innerHTML+naoEncontrado;
	}
};

/**
 * Ferramenta para aplicar um link a seleção
 * @class ToolAplicarLink
 */
var ToolAplicarLink = Class.create();
ToolAplicarLink.prototype = {
	/**
	 * @type TextEditor
	 */
	textEditorInstance: null,
	/**
	 * @constructor
	 * 
	 * @param {TextEditor} textEditor
	 * @return
	 */
	initialize: function(textEditor){
		this.textEditorInstance = textEditor;
	},
	/**
	 * @type HTMLDivElement
	 */
	divConteudo: null,
	/**
	 * Abrir a tela para digitar o endereço
	 * @return
	 */
	aplicarFormatacao: function(){
		if(this.divConteudo != null){
			return;
		}
		var fecharJanela = this.fecharJanela.bind(this);
		var confirmarAplicarLink = this.confirmarAplicarLink.bind(this);
		/**
		 * @type HTMLDivElement
		 */
		var divConteudo = UtilTextEditor.getJanelaPadrao("Criar link", 97, 351, confirmarAplicarLink, fecharJanela, this.textEditorInstance);
		this.divConteudo = $(divConteudo);
		divConteudo.appendChild(Builder.node("div", [
			Builder.node("span", {style: "font-weight: bold; color:red; font-size: 9px;", id: "mensagem"}),
			Builder.node("div", {style: "width: 120px;font-size: 12px; color:gray;float:left;"}, [
				document.createTextNode("Endereço (URL): ")
			]),
			Builder.node("div", [
				Builder.node("input", {type: "text", id: "url", style: "width: 198px;"})
			])
		]));
	},
	/**
	 * Aplicar link a seleção
	 * @return
	 */
	confirmarAplicarLink: function(){
		var inputUrl = this.divConteudo.select("input[id=\"url\"]").first();
		var mensagemSpan = this.divConteudo.select("span[id=\"mensagem\"]").first();
		var url = inputUrl.getValue();
		if(url.blank()){
			mensagemSpan.update("É necessário digitar uma URL!");
			return;
		}
		var range = new WrapperTextRange(this.textEditorInstance);
		if(range.getSelectedText().blank()){
			mensagemSpan.update("Selecione um texto para aplicar um link!");
			return;
		}
		this.textEditorInstance.executarComando("unlink");
		this.textEditorInstance.executarComando("createLink", url);
		this.fecharJanela();
		this.divConteudo = null;
	},
	fecharJanela: function(){
		this.divConteudo.up().remove();
		this.divConteudo = null;
	}
};
/**
 * Ferramenta de edição de HTML
 * @class ToolEditHTML
 */
var ToolEditHTML = Class.create();
ToolEditHTML.prototype = {
	/**
	 * @type TextEditor
	 */
	textEditorInstance: null,
	/**
	 * @constructor
	 * 
	 * @param {TextEditor} textEditor
	 * @return
	 */
	initialize: function(textEditor){
		this.textEditorInstance = textEditor;
	},
	/**
	 * @type HTMLSelectElement
	 */
	textarea: null,
	/**
	 * abrir janela de edição do HTML gerado pelo editor de texto
	 */
	aplicarFormatacao: function(){
		if(this.textarea != null){
			return;
		}
		var botaoAtualizarCodigo = Builder.node("input", {
			type:"checkbox", 
			style: "height: 15px; vertical-align:middle;", 
			id: "atualizarCodigo"
		});
		/**
		 * @type HTMLDivElement
		 */
		var divConteudo = UtilTextEditor.getJanelaPadrao("Editar HTML", 200, 365, this.botaoOK.bind(this), this.botaoCancelar.bind(this), this.textEditorInstance);
		var textarea=Builder.node("textarea", {style: "width: 339px; border: solid 1px gray;"}, [
			document.createTextNode(this.textEditorInstance.getHTML())
		]);
		this.textarea = textarea;
		divConteudo.appendChild(Builder.node("div", [
			Builder.node("label", {style: "font-size: 10px;color:gray;", htmlFor:"atualizarCodigo"}, [
				botaoAtualizarCodigo,
				document.createTextNode("atualizar a tela com o código ao digitar")
			]),
			Builder.node("div", {style: "text-align: center"}, [
				textarea,
			])
		]));
		divConteudo = $(divConteudo);
		Event.observe(botaoAtualizarCodigo, "click", this.ativarAtualizarConteudo.bind(this));
		
		divConteudo.up().setStyle({
			left:((this.textEditorInstance.divContainer.getWidth()-divConteudo.up().getWidth())-5)+ "px" 
		});
		
		var rows = Math.round(((this.textEditorInstance.iframeDocument.body.clientHeight)/31))-2;
		if(rows <= 0){
			rows = 1;
		}
		this.textarea.rows = rows;
	},
	/**
	 * Ativar a sincronização do conteúdo HTML da janela de edição do html com 
	 * o editor de texto principal
	 * @param {Event} event
	 */
	ativarAtualizarConteudo: function(event){
		var ativar = Event.element(event).checked;
		var textArea = this.textarea;
		if(ativar){
			Event.observe(textArea, "keyup", this.copiarConteudo.bindAsEventListener(this));
		}else{
			Event.stopObserving(textArea, "keyup");
		}
	},
	/**
	 * botão cancelar da janela de editHTML
	 */
	botaoCancelar: function(){
		this.fecharEditHTML();
	},
	/**
	 * fechar a janela sem copiar o html para a tela (Esc) 
	 */
	fecharEditHTML: function(){
		var div = UtilTextEditor.getDivCampo(this.textarea);
		div.remove();
		this.textarea = null;
	},
	/**
	 * Copiar o conteúdo da janela de edição do html para o editor
	 */
	copiarConteudo: function(){
		var html = this.textarea.getValue();
		this.textEditorInstance.setHTML(html);
	},
	/**
	 * botão ok da janela de edição do HTML
	 */
	botaoOK: function(){
		this.copiarConteudo();
		this.fecharEditHTML();
	}
};

/**
 * Meta dados das ferramentas
 * @class MetaDadosFerramentas
 */
var MetaDadosFerramentas = Class.create();
MetaDadosFerramentas.prototype = {
	/**
	 * Nome do arquivo que representa o ícone
	 * @type String
	 */
	imageSrc: null,
	/**
	 * Comando de formatação
	 * @type String
	 */
	comando: null,
	/**
	 * Título dica do botão
	 * @type String
	 */
	titulo: null,
	/**
	 * Instância da ferramenta
	 * @type Object
	 */
	toolInstance: null,
	/**
	 * @constructor
	 * 
	 * @param {String} imageSrc
	 * @param {String} comando
	 * @param {String} titulo
	 * @param {Object} toolInstance
	 * @return
	 */
	initialize: function(imageSrc, titulo, comando, toolInstance){
		this.imageSrc = imageSrc;
		this.comando = comando;
		this.titulo = titulo;
		this.toolInstance = toolInstance;
	}
};
/**
 * Classe principal
 * @class TextEditor 
 */
var TextEditor = Class.create();
TextEditor.prototype = {

	/**
	 * Caminho base onde estão todos os recursos do editor de texto
	 * @type String
	 */
	basePath: null,
	
	/**
	 * id do elemento que representa a editArea
	 * @type String
	 */
	idEditArea: "editAreaElement",
	
	/**
	 * área editável (onde o usuário irá utilizar sua imaginação )
	 * @type HTMLIFrameElement
	 */
	editArea: null,
	
	/**
	 * Objeto documento do iframe
	 * @type HTMLDocument
	 */
	iframeDocument: null,
	
	/**
	 * Onde o text editor foi criado
	 * @type HTMLDivElement
	 */
	divContainer: null,
	
	/**
	 * barra de ferramentas
	 * @type HTMLDivElement
	 */
	barraFerramentas: null,
	
	/**
	 * Tags que deverão ser sempre removidas do texto
	 * @type Array
	 */
	forbiddenTags: null,
	
	/**
	 * Adicionar uma tag não permitida (que deverá ser removida toda vez que aparecer no texto)
	 * @param {String} tag
	 * @return
	 */
	addNotAllowedTag: function(tag){
		 if(this.forbiddenTags == null){
			 this.forbiddenTags = new Array();
			 this.setListenerEditArea(this.removeTags.bind(this));
		 }
		 this.forbiddenTags.push(tag);
	},
	/**
	 * Função que limpará o texto de tempos em tempos
	 * @param {HTMLElement} elemento
	 * @param {String} valor
	 * @return
	 */
	removeTags: function(elemento, valor){
		this.forbiddenTags.each((function(tag){
			this.removerTag(elemento, tag);
		}).bind(this));
	},
	/**
	 * Remover tags do texto, sem remover o conteúdo das mesmas
	 * @param {HTMLElement} elementoPai
	 * @param {String} tag
	 * @return
	 */
	removerTag: function(elementoPai, tag){
		 var dls = $A(elementoPai.getElementsByTagName(tag));
			
		 dls.each(function(dl){
			 var appendNode = dl.parentNode;
			 var filhos = $A(dl.childNodes);
			 for ( var index = 0; index < filhos.length; index++) {
				 var node = filhos[index];
				 node.parentNode.removeChild(node);
				 
				 if(index == 0){
					 appendNode.replaceChild(node, dl);
					 appendNode = node;
				 }else{
					 Element._insertionTranslations.after(appendNode, node);
				 }
			 }
		});
	},
	
	/**
	 * recuperar o diretório onde o editor.js está para poder carregar os recursos utilizados
	 * pelo componente (como imagens dos botões e etc.)
	 * @return o diretório base onde o text-editor está instalado no webapp 
	 * @type String
	 */
	getBasePath: function(){
		if(this.basePath == null){
			var scriptTag = $A(document.getElementsByTagName("script")).find(function(s) {
				return s.src.indexOf("editor.js") != -1
			});
	
			var src = scriptTag.src;
			this.basePath = src.substring(0, src.indexOf("editor.js"));
		}
		return this.basePath;
	},
	/**
	 * @constructor
	 * 
	 * @param {HTMLDivElement} divContainer elemento onde o text editor deverá ser criado
	 */
	initialize: function(divContainer){
		this.forbiddenTags = null;
		this.divContainer = $(divContainer);
		
		var larguraDivContainer = this.divContainer.getWidth();
		var alturaDivContainer = this.divContainer.getHeight();
		
		$(this.divContainer).setStyle({
			fontFamily: "Arial",
			border: "1px solid gray",
			backgroundColor: "white"
		});
		this.configurarBarraFerramentas();
		/**
		 * @type HTMLIFrameElement
		 */
		var iframe = Builder.node("iframe");
		iframe.frameBorder = 0;
		iframe.frameMargin = 0;
		iframe.framePadding = 0;
		iframe.width = "100%";
		iframe.height = alturaDivContainer - this.barraFerramentas.getHeight()-3;
		iframe.src = "javascript:void(0);";
		this.editArea = iframe;
		this.divContainer.appendChild(this.editArea);
		
		/**
		 * @type HTMLDocument
		 */
		var iframeDocument = iframe.contentWindow.document;
		this.iframeDocument = iframeDocument;
		try {
			iframeDocument.designMode = "on";
		} catch ( e ) {
			// Will fail on Gecko if the editor is placed in an hidden container element
			// The design mode will be set ones the editor is focused
			$(iframeDocument).observe("focus", iframeDocument.designMode.bind(iframeDocument));
		}
		iframeDocument.open();
		
		var iframeContent = "<html><head></head><body style=\"padding:5px\"></body></html>";
		iframeDocument.write(iframeContent);
		iframeDocument.close();
		
		this.editArea.id = "editArea";
		try{
			this.editArea.focus();
		}catch (e) {
		}
		this.posConfiguracaoFerramentas();
	},
	/**
	 * 
	 * Se firefox retorna {HTMLBodyElement}
	 * Se IE retorna {HTMLDivElement}
	 * 
	 * IMPORTANTE: Observe que o prototype não extend o body, então ele não tem os 
	 * métodos que os elementos extendidos tem
	 *  
	 * @return Retorna a área de edição do do TextEditor
	 * @type HTMLElement
	 */
	getEditArea: function(){
		return this.editArea;
	},
	/**
	 * @type Form.Element.EditAreaObserver
	 */
	editAreaObserver: null,
	/**
	 * setar um listener para observar sempre que houver alteração no texto do editor
	 * @param {Function} callback
	 */
	setListenerEditArea: function(callback){
	 	new PeriodicalExecuter((function(pe){
			var editArea = this.iframeDocument;
			if(this.editAreaObserver == null){
				this.editAreaObserver = new Form.Element.EditAreaObserver(editArea, 0.1, callback);
			}else{
				this.editAreaObserver.stop();
				this.editAreaObserver = new Form.Element.EditAreaObserver(editArea, 0.1, callback);
			}
			if(callback == null){
				this.editAreaObserver.stop();
				this.editAreaObserver = null;
			}
			pe.stop();
		}).bind(this), 0.2);
	},
	
	/**
	 * Construir a barra de ferramentas
	 */
	configurarBarraFerramentas: function(){
		this.barraFerramentas = Builder.node("div", {style: "padding-left:4px; margin-top: 3px; border-bottom: solid 1px #E9E9E9; height: 22px; background-color: #FBFDFF"});
		/**
		 * @type Array
		 */
		var ferramentas = this.getFerramentas();
		ferramentas.each(this.adicionarBotao.bind(this));
		
		this.divContainer.appendChild(this.barraFerramentas);
		
		var ultimo=$(this.barraFerramentas.lastChild);
		if(Prototype.Browser.IE){
			ultimo.setStyle({styleFloat: "right"});
		}else{
			ultimo.setStyle({cssFloat: "right"});
		}
	},
	/**
	 * Adiciona o botão na barra de ferramentas
	 * @param {MetaDadosFerramentas} metaDados
	 */
	adicionarBotao: function(metaDados){
		if(metaDados.imageSrc != null && metaDados.titulo != null){
			var img = this.getImageToolBar(metaDados.imageSrc);
			var titulo = metaDados.titulo;
			img.title = titulo;
			img.alt = titulo;
			if(metaDados.comando != null){
				Event.observe(img, "click", this.executarComando.bind(this, metaDados.comando));
				this.barraFerramentas.appendChild(img);
			}else{
				var tool = metaDados.toolInstance;
				Event.observe(img, "click", tool.aplicarFormatacao.bind(tool));
			}
			this.barraFerramentas.appendChild(img);
		}else{
			var tool = metaDados.toolInstance;
			var botaoFerramenta = tool.getElementoTela();
			var divFerramentas=this.getDivFerramentas(botaoFerramenta);
			this.barraFerramentas.appendChild(divFerramentas);
		}
	},
	posConfiguracaoFerramentas: function(){
		//pos configuração de ferramentas, se um dia necessário
	},
	/**
	 * @return array com todos os metadados que representam as ferramentas
	 * @type Array
	 */
	getFerramentas: function(){
		var metadados = new Array();
		metadados.push(new MetaDadosFerramentas("text_normal.png", "Retirar a formatação do texto selecionado", "removeFormat"));
		metadados.push(new MetaDadosFerramentas("text_bold.png", "Negrito", "Bold"));
		metadados.push(new MetaDadosFerramentas("text_italics.png", "Texto em itálico", "italic"));
		metadados.push(new MetaDadosFerramentas("text_underlined.png", "Sublinhar o texto", "underline"));
		metadados.push(new MetaDadosFerramentas("text_align_left.png", "Alinhar a esquerda", "justifyleft"));
		metadados.push(new MetaDadosFerramentas("text_align_center.png", "Alinhar no centro", "justifycenter"));
		metadados.push(new MetaDadosFerramentas("text_align_right.png", "Alinhar a direita", "justifyright"));
		metadados.push(new MetaDadosFerramentas("text_align_justified.png", "Justiticar texto", "justifyfull"));
		metadados.push(new MetaDadosFerramentas("format-indent-more.png", "Indentar o texto", "indent"));
		metadados.push(new MetaDadosFerramentas("format-indent-less.png", "Remover indentação", "outdent"));
		metadados.push(new MetaDadosFerramentas("format-indent-plus-more.png", "Adicionar parágrafo (tabulação)", null, new ToolIndent(this)));
		metadados.push(new MetaDadosFerramentas("format-indent-plus-less.png", "Remover parágrafo (tabulação)", null, new ToolOutdent(this)));
		
		
		var titulo = "Colocar o texto selecionado no rodapé de todas as páginas (somente para impressão de PDF)";
		metadados.push(new MetaDadosFerramentas("layout_south.png", titulo, null, new ToolAlignBottom(this)));
		
		var tituloCabecalho = "Colocar o texto selecionado no cabeçalho de todas as páginas (somente para impressão de PDF)";
		metadados.push(new MetaDadosFerramentas("layout_north.png", tituloCabecalho, null,new ToolAlignTop(this)));
		
		metadados.push(new MetaDadosFerramentas("link_new.png", "Clique aqui para adicionar um link. " +
																"Digite o link desejado no campo endereço, " +
																"Selecione o texto desejado e " +
																"clique OK para aplicar o link a seleção. ", null, new ToolAplicarLink(this)));
		metadados.push(new MetaDadosFerramentas("link_delete.png", "Remover o link da seleção", "unlink"));
		
		metadados.push(new MetaDadosFerramentas(null, null, null, new ToolColor(this)));
		metadados.push(new MetaDadosFerramentas(null, null, null, new ToolFormatacao(this)));
		metadados.push(new MetaDadosFerramentas(null, null, null, new ToolTamanhoFonte(this)));
		
		metadados.push(new MetaDadosFerramentas("text-html.png", "Visualizar o código HTML do texto", null, new ToolEditHTML(this)));
		return metadados;
	},
	
	
	/**
	 * 
	 * @param {String} id
	 * @return recupera um elemento de dentro da EditArea
	 * @type HTMLElement
	 */
	getElementByIdEditArea: function(id){
		return this.iframeDocument.getElementById(id);
	},
	
	/**
	 * html a ser setado no conteúdo
	 * @type String
	 */
	html: null,
	/**
	 * setar o html no corpo do textEditor
	 * @param {String} html
	 */
	setHTML: function(html){
		this.iframeDocument.body.innerHTML = html;
		this.html = html;
		this.corrigirPathImagens();
	},
	/**
	 * Corrigir os paths das imagens adicionando o base href (bug do firefox
	 * que não reconhece a tag <base href=""> dinamicamente)
	 */
	corrigirPathImagens: function(){
		var images = $A(this.iframeDocument.getElementsByTagName("img"));
		var path = window.location.href.substring(0, window.location.href.lastIndexOf("/", window.location.href.length)) +"/";
		
		images.each(function(image){
			if(image.src.indexOf(path) == -1){
				image.src = path+image.src;
			}
		});
	},
	/**
	 * retornar texto html produzido pelo usuário
	 * @return texto html produzido pelo usuário
	 * @type String
	 */
	getHTML: function(){
		return this.iframeDocument.body.innerHTML;
	},
	/**
	 * recuperar o texto sem as tags html
	 * @return o texto sem as tags html
	 * @type String
	 */
	getText: function(){
		return this.getHTML().stripTags();
	},
	/**
	 * Executar um comando de formatação ao texto selecionado
	 * 
	 * @param {String} comando
	 * @param {Object} values
	 */
	executarComando: function(comando, values){
		this.editArea.contentWindow.focus();
		try{
			this.iframeDocument.execCommand(comando, false, values);
		}catch(e){/* do nothing */}
		this.editArea.contentWindow.focus();
	},
	/**
	 * @param {String} src
	 * @return caminho completo das imagens
	 * @type String
	 */
	getBasePathImagens: function(src){
		return this.getBasePath()+"images/"+src;
	},
	/**
	 * @param {HTMLDivElement} encobrir
	 * @return uma div com estilo e margens pré-definidas
	 * @type HTMLDivElement 
	 */
	getDivFerramentas: function(encobrir){
		return $(Builder.node("div", {style: "margin-left: 5px; float: left; height: 20px;"},[encobrir]));
	},
	/**
	 * @param {String} src
	 * @return imagem nested com uma div
	 * @type HTMLDivElement
	 */
	getImageToolBar: function(src){
		src = this.getBasePathImagens(src);
		var img = Builder.node("img", {height: "16", width: "16", style: "cursor: pointer; border: solid 1px white;", src: src});
		Event.observe(img, "mouseover", this.toggleEstiloBotao.bindAsEventListener());
		Event.observe(img, "mouseout", this.toggleEstiloBotao.bindAsEventListener());
		return this.getDivFerramentas(img);
	},
	/**
	 * Mostrar o contorno do botão
	 * @param {Event} event
	 * @return
	 */
	toggleEstiloBotao: function(event){
		
		var img = Event.element(event);
		if(img.toggleBorder == undefined){
			img.toggleBorder = true;
		}
		if(img.toggleBorder){
			img.style.border = "solid 1px gray";
		}else{
			img.style.border = "solid 1px white";
		}
		img.toggleBorder = !img.toggleBorder;
	}
};
