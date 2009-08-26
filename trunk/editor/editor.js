/**
 * Editor de texto built-in
 * Rev 4718
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
		return this.element.innerHTML;
	}
});
/**
 * Wrapper para recuperar o texto selecionad
 * FIXME ainda tem alguns bugs no firefox
 */
var WrapperTextRange = Class.create();
WrapperTextRange.prototype = {
	/**
	 * @type Range
	 */
	range: null,
	/**
	 * @constructor
	 * @param {HTMLIframeElement} editArea
	 */
	initialize: function(editArea){
		if(Prototype.Browser.IE){
			this.range = document.selection.createRange();
		}
		if(Prototype.Browser.Gecko){
			this.range = editArea.contentWindow.getSelection();
		}
	},
	/**
	 * mover para o final
	 * @param {Number} caracteres
	 * @return quantidade de caracteres movidos
	 * @type String
	 */
	moveEnd: function(caracteres){
		if(Prototype.Browser.IE){
			return this.range.moveEnd("character", caracteres);
		}
		if(Prototype.Browser.Gecko){
			var rangeWork = this.getFirefoxRange();
			rangeWork.setEnd(rangeWork.endOffset+caracteres);
			return caracteres;
		}
		return null;
	},
	/**
	 * @param {Number} caracteres
	 * @return quantidade de caracteres movidos
	 * @type Number
	 */
	moveStart: function(caracteres){
		if(Prototype.Browser.IE){
			return this.range.moveStart("character", caracteres);
		}
		if(Prototype.Browser.Gecko){
			var rangeWork = this.getFirefoxRange();
			rangeWork.setStart(rangeWork.startOffset+caracteres);
			return caracteres;
		}
		return null;
	},
	/**
	 * @return html do texto selecionado
	 * @type String
	 */
	getText: function(){
		if(Prototype.Browser.IE){
			return this.range.text;
		}
		if(Prototype.Browser.Gecko){
			return this.range.toString();
		}
		return null;
	},
	/**
	 * recuperar o html do texto selecionado
	 * @return html do texto selecionado
	 * @type String
	 */
	getHTMLText: function(){
		if(Prototype.Browser.IE){
			return this.range.htmlText;
		}
		if(Prototype.Browser.Gecko){
			return Builder.node("div", [this.getFirefoxRange().cloneContents()]).innerHTML;
		}
		return null;
	},
	/**
	 * colar um fragmento de texto com html na seleção
	 * @param {String} html
	 */
	setHTMLText: function(html){
		if(Prototype.Browser.IE){
			this.range.pasteHTML(html);
		}
	},
	/**
	 * Aplicar uma tag ao texto selecionado
	 * Essa só funciona no Gecko
	 * @param elemento
	 */
	surroundContents: function(elemento){
		if(Prototype.Browser.Gecko){
			this.getFirefoxRange().surroundContents(elemento);
		}
	},
	/**
	 * Mover a seleção para o elemento passado
	 * @param oElement
	 * @return
	 */
	moveToElementText: function(oElement){
		if(Prototype.Browser.IE){
			this.range.moveToElementText(oElement);
		}
		if(Prototype.Browser.Gecko){
			this.getFirefoxRange().selectNode(oElement);
		}
	},
	getFirefoxRange: function(){
		return this.range.getRangeAt(0);
	},
	/**
	 * Recuperar o elemento pai da seleção
	 * @return o elemento pai da seleção
	 * @type Node
	 */
	parentElement: function(){
		var parentNode  = null;
		if(Prototype.Browser.IE){
			parentNode = this.range.parentElement();
		}
		if(Prototype.Browser.Gecko){
			parentNode = this.getFirefoxRange().commonAncestorContainer.parentNode;
		}
		return parentNode;
	},
	/**
	 * Selecionar o texto
	 * @return
	 */
	select: function(){
		if(Prototype.Browser.IE){
			this.range.select();
		}
	},
	/**
	 * Executar um comando na seleção
	 * @param command
	 * @return
	 */
	execCommand: function(command){
		if(Prototype.Browser.IE){
			this.range.execCommand(command);
		}
	},
	/**
	 * Remover a formatação do texto selecionado
	 */
	removerFormatacao: function(){
		if(Prototype.Browser.IE){
			if(this.getHTMLText().blank()){
				return;
			}
			this.execCommand("RemoveFormat");
		}
		if(Prototype.Browser.Gecko){
			var textoSuper = this.getFirefoxRange().commonAncestorContainer;
			var elementoSuper = textoSuper.parentNode;
			if(elementoSuper.nodeName.toLowerCase() != "body" && Node.TEXT_NODE == textoSuper.nodeType){
				elementoSuper.parentNode.replaceChild(textoSuper, elementoSuper);
			}
		}
	},
	/**
	 * Apagar o texto selecionado
	 * @return
	 */
	apagarTexto: function(){
		if(Prototype.Browser.IE){
			this.setHTMLText("");
		}
		if(Prototype.Browser.Gecko){
			var rangeWork = this.getFirefoxRange();
			rangeWork.deleteContents();
		}
	}
};

/**
 * Classe principal
 */
var TextEditor = Class.create();
TextEditor.prototype = {
	basePath: null,
	/**
	 * id do elemento que representa a editArea
	 * @type String
	 */
	idEditArea: "editAreaElement",
	/**
	 * área editável (onde o usuário irá utilizar sua imaginação ) que
	 * pode ser uma div se for IE ou um iframe se o browser for o Firefox
	 * @type HTMLElement  
	 */
	editArea: null,
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
			$A(document.getElementsByTagName("script")).findAll( (function(s) {
				if(s.src.indexOf("editor.js") != -1){
					var src = s.src;
					this.basePath = src.substring(0, src.indexOf("editor.js"));
					throw $break;
				}
			}).bind(this));			
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
		if(Prototype.Browser.IE){
			this.editArea = Builder.node("div", {style: "padding-left: 7px;", id: this.idEditArea});
			/* ocorre um bug aqui pro IE7/8 não sei quando começou isso mas esse bug não existia
			 * o objeto mesmo estando na tela com uma algura e uma largura definida no estilo
			 * ele não possui dimensões (todas as propriedades de dimensões apresentam 0), esse código 
			 * é acionado de um evento onload do objeto window, o que significa que os objetos que estão na tela
			 * não foram totalmente carregados.
			 * Investiguei o problema e essa foi a melhor solução recuperar a altura/largura do estilo se 
			 * as dimensões reais estiverem zeradas.
			 * */
			if(larguraDivContainer == 0){
				larguraDivContainer = this.divContainer.style.pixelWidth;
			}
			if(alturaDivContainer == 0){
				alturaDivContainer = this.divContainer.style.pixelHeight;
			}
			this.editArea.contentEditable = true;
			$(this.editArea).setStyle({
				clear: "both",
				overflow: "auto",
				height: (alturaDivContainer-29 )+"px",
				width: (larguraDivContainer-11)+ "px"
			});
			this.divContainer.appendChild(this.editArea);
		}else if(Prototype.Browser.Gecko){
			var iframe = Builder.node("iframe", {frameBorder: "no", scrolling: "no", width: "100%", height: "100%", id: this.idEditArea});
			this.editArea = iframe;
			this.divContainer.appendChild(this.editArea);
			
			new PeriodicalExecuter((function(pe){
				this.editArea.contentWindow.document.designMode = "on";
				try {
					this.editArea.contentWindow.document.execCommand("undo", false, null);
				} catch (e) {
					alert("This demo is not supported on your level of Mozilla.");
				}
				$(this.editArea).setStyle({
					overflow: "auto",
					height: (alturaDivContainer-29 )+"px",
					width: (larguraDivContainer-3)+ "px"
				});
				pe.stop();
				this.setHTML(this.html);
				this.editArea.focus();
			}).bind(this), 0.1);
		}else{
			alert("Não há suporte para o seu browser =(");
			return;
		}
		this.editArea.id = "editArea";
		this.editArea.focus();
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
		if(Prototype.Browser.IE){
			return this.editArea;
		}
		if(Prototype.Browser.Gecko){
			return this.editArea.contentDocument.body;
		}
		
		return null;
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
			var editArea = this.getEditArea();
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
		this.toolNormal();
		this.toolBold();
		this.toolItalics();
		this.toolUnderline();
		this.toolAlignLeft();
		this.toolAlignCenter();
		this.toolAlignRight();
		this.toolJustify();
		this.toolAlignBottom();
		this.toolAlignTop();
		this.toolFormatacao();
		this.toolTamanhoFonte();
		this.toolColor();
		this.toolEditHTML();
		this.divContainer.appendChild(this.barraFerramentas);
	},
	/**
	 * Construir botão para remover formatação do texto selecionado
	 */
	toolNormal: function(){
		var img = this.getImageToolBar("text_normal.png");
		var titulo = "Retirar a formatação do texto selecionado";
		img.title = titulo;
		img.alt = titulo;
		Event.observe(img, "click", this.aplicarNormal.bind(this));
		this.barraFerramentas.appendChild(img);
	},
	/**
	 * remover qualquer formatação do texto selecionado
	 */
	aplicarNormal: function(){
		var range = new WrapperTextRange(this.editArea);
		range.removerFormatacao();
	},
	/**
	 * Construir botão para aplicar negrito ao texto selecionado
	 */
	toolBold: function(){
		var img = this.getImageToolBar("text_bold.png");
		var titulo = "Negrito";
		img.title = titulo;
		img.alt = titulo;
		Event.observe(img, "click", this.aplicarBold.bind(this));
		this.barraFerramentas.appendChild(img);
	},
	/**
	 * aplicar negrito ao texto selecionado
	 */
	aplicarBold: function(){
		this.aplicarTagTextoSelecionado("b");
		this.executarComandoIE("Bold");
	},
	/**
	 * Construir botão para aplicar estilo itálico ao texto selecionado
	 */
	toolItalics: function(){
		var img = this.getImageToolBar("text_italics.png");
		var titulo = "Texto em itálico";
		img.title = titulo;
		img.alt = titulo;
		Event.observe(img, "click", this.aplicarItalics.bind(this));
		this.barraFerramentas.appendChild(img);
	},
	/**
	 * aplicar estilo itálico ao texto selecionado
	 */
	aplicarItalics: function(){
		this.aplicarTagTextoSelecionado("i");
		this.executarComandoIE("Italic");
	},
	/**
	 * Construir botão para sublinhar o texto selecionado
	 */
	toolUnderline: function(){
		var img = this.getImageToolBar("text_underlined.png");
		var titulo = "Sublinhar o texto";
		img.title = titulo;
		img.alt = titulo;
		Event.observe(img, "click", this.aplicarUnderline.bind(this));
		this.barraFerramentas.appendChild(img);
	},
	/**
	 * sublinhar o texto selecionado
	 */
	aplicarUnderline: function(){
		this.aplicarTagTextoSelecionado("u");
		this.executarComandoIE("Underline");
	},
	/**
	 * Construir botão para alinhar o texto selecionado a esquerda
	 */
	toolAlignLeft: function(){
		var img = this.getImageToolBar("text_align_left.png");
		var titulo = "Alinhar a esquerda";
		img.title = titulo;
		img.alt = titulo;
		Event.observe(img, "click", this.aplicarAlignLeft.bind(this));
		this.barraFerramentas.appendChild(img);
	},
	/**
	 * alinhar o texto selecionado a esquerda
	 */
	aplicarAlignLeft:function(){
		this.aplicarTagTextoSelecionado("div", "style=\"text-align: left;\"");
		this.executarComandoIE("JustifyLeft");
	},
	/**
	 * Construir botão para alinhar o texto selecionado no centro
	 */
	toolAlignCenter: function(){
		var img = this.getImageToolBar("text_align_center.png");
		var titulo = "Alinhar no centro";
		img.title = titulo;
		img.alt = titulo;
		Event.observe(img, "click", this.aplicarAlignCenter.bind(this));
		this.barraFerramentas.appendChild(img);
	},
	/**
	 * Alinhar o texto selecionado no centro
	 */
	aplicarAlignCenter:function(){
		this.aplicarTagTextoSelecionado("div", "style=\"text-align: center;\"");
		this.executarComandoIE("JustifyCenter");
	},
	/**
	 * Construir botão para alinhar a direita o texto selecionado
	 */
	toolAlignRight: function(){
		var img = this.getImageToolBar("text_align_right.png");
		var titulo = "Alinhar a direita";
		img.title = titulo;
		img.alt = titulo;
		Event.observe(img, "click", this.aplicarAlignRight.bind(this));
		this.barraFerramentas.appendChild(img);
	},
	/**
	 * alinhar o texto selecionado a direita
	 */
	aplicarAlignRight: function(){
		this.aplicarTagTextoSelecionado("div", "style=\"text-align: right;\"");
		this.executarComandoIE("JustifyRight");
	},
	/**
	 * Ferramenta para tornar uma parte do texto como cabeçalho fixo do documento quando impresso 
	 */
	toolAlignTop: function(){
		var img = this.getImageToolBar("layout_north.png");
		Event.observe(img, "click", this.aplicarAlignTop.bind(this));
		var titulo = "Colocar o texto selecionado no cabeçalho de todas as páginas (somente para impressão de PDF)";
		img.title = titulo;
		img.alt = titulo;
		this.barraFerramentas.appendChild(img);
	},
	/**
	 * @type Template
	 */
	templateSessoes: new Template("overflow: hidden; height: 90px; border: 1px solid blue;background-position: center center; background-repeat: no-repeat; background-image: url(\"#{imagem}\");"),
	/**
	 * Cabeçalho do documento
	 * @type HTMLDivElement
	 */
	header: null,
	/**
	 * Estilo das sessões
	 * @param {String}imagem
	 * @return o estilo a ser aplicado 
	 * @type String
	 */
	getEstiloSessao: function(imagem){
		var src = this.getBasePathImagens(imagem);
		return this.templateSessoes.evaluate({imagem: src});
	},
	/**
	 * colocar o texto selecionado no cabeçalho do documento 
	 */
	aplicarAlignTop: function(){
		var range = new WrapperTextRange(this.editArea);
		var naoEncontrado = range.getHTMLText();
		if(naoEncontrado.blank()){
			return;
		}
		range.apagarTexto();
		var headerID = "header";
		this.header = this.getElementByIdEditArea(headerID);
		if(this.header == null){
			this.header = Builder.node("div", {style: this.getEstiloSessao("header.png"), title: "Cabeçalho do texto",id: headerID});
		}
		var firstChild = this.getEditArea().firstChild;
		if(firstChild == null){
			this.getEditArea().appendChild(this.header);
		}else{
			Element.insert(firstChild, {before: this.header});
		}
		this.header.innerHTML = this.header.innerHTML+naoEncontrado;
	},
	/**
	 * 
	 * @param {String} id
	 * @return recupera um elemento de dentro da EditArea
	 * @type HTMLElement
	 */
	getElementByIdEditArea: function(id){
		if(Prototype.Browser.Gecko){
			return this.getEditArea().ownerDocument.getElementById(id);
		}
		if(Prototype.Browser.IE){
			var ids = this.getEditArea().select("[id=\""+id+"\"]");
			if(ids.length != 0){
				return ids[0];
			}
		}
		return null;
	},
	/**
	 * Ferramenta para alinhar os elementos selecionados no fundo da página
	 * Para os modelos de carta
	 */
	toolAlignBottom: function(){
		var img = this.getImageToolBar("layout_south.png");
		Event.observe(img, "click", this.aplicarAlignBottom.bind(this));
		var titulo = "Colocar o texto selecionado no rodapé de todas as páginas (somente para impressão de PDF)";
		img.title = titulo;
		img.alt = titulo;
		this.barraFerramentas.appendChild(img);
	},
	/**
	 * Rodapé do documento
	 * @type HTMLDivElement
	 */
	footer: null,
	/**
	 * jogar o texto selcionado para o rodapé
	 */
	aplicarAlignBottom: function(){
		var range = new WrapperTextRange(this.editArea);
		var naoEncontrado = range.getHTMLText();
		if(naoEncontrado.blank()){
			return;
		}
		range.apagarTexto();
		var footerId = "footer";
		this.footer = this.getElementByIdEditArea(footerId);
		if(this.footer == null){
			this.footer = Builder.node("div", {style: this.getEstiloSessao("footer.png"), title: "Rodapé do texto", id: footerId});
		}
		this.getEditArea().appendChild(this.footer);
		this.footer.innerHTML = this.footer.innerHTML+naoEncontrado;
	},
	/**
	 * Construir botão para justificar o texto selecionado
	 */
	toolJustify: function(){
		var img = this.getImageToolBar("text_align_justified.png");
		Event.observe(img, "click", this.aplicarJustify.bind(this));
		var titulo = "Justiticar texto";
		img.title = titulo;
		img.alt = titulo;
		this.barraFerramentas.appendChild(img);
	},
	/**
	 * Aplicar alinhamento justificado ao texto selecionado
	 */
	aplicarJustify: function(){
		this.aplicarTagTextoSelecionado("div", "style=\"text-align: justify;\"");
	},
	/**
	 * Construir o combo para seleção de um novo formato de fonte para aplicar ao texto selecionado
	 */
	toolFormatacao: function(){
		var select = Builder.node("select", {title: "Tipo da fonte do texto selecionado", style: "height: 15px; margin-left: 5px; font-size: 8px;"}, [
			Builder.node("option", {value: "Arial"}, [document.createTextNode("Arial")]),
			Builder.node("option", {value: "Verdana"}, [document.createTextNode("Verdana")]),
			Builder.node("option", {value: "Times New Roman"}, [document.createTextNode("Times New Roman")]),
			Builder.node("option", {value: "Courier New"}, [document.createTextNode("Courier New")]),
			Builder.node("option", {value: "Comic Sans MS"}, [document.createTextNode("Comic Sans MS")])
		]);
		Event.observe(select, "change", this.aplicarFormatacao.bindAsEventListener(this));
		this.barraFerramentas.appendChild(this.getDivFerramentas(select));
		select.selectedIndex = 2;
	},
	/**
	 * aplicar novo formato de fonte ao texto selecionado
	 * @param {Event} event
	 */
	aplicarFormatacao: function(event){
		var select = Event.element(event);
		var fonte = $(select).getValue();
		this.aplicarTagTextoSelecionado("span", "style=\"font-family: "+fonte+"\"");
		this.executarComandoIE("FontName", fonte);
	},
	/**
	 * Construir combo para seleção de um novo tamanho para aplicar ao texto selecionado
	 */
	toolTamanhoFonte: function(){
		var opcoes = new Array();
		if(Prototype.Browser.Gecko){
			opcoes.push(Builder.node("option", {value: "8px"}, [document.createTextNode("8")]));
			opcoes.push(Builder.node("option", {value: "10px"}, [document.createTextNode("10")]));
			opcoes.push(Builder.node("option", {value: "12px", selected: "selected"}, [document.createTextNode("12")]));
			opcoes.push(Builder.node("option", {value: "14px"}, [document.createTextNode("14")]));
			opcoes.push(Builder.node("option", {value: "16px"}, [document.createTextNode("16")]));
			opcoes.push(Builder.node("option", {value: "18px"}, [document.createTextNode("18")]));
			opcoes.push(Builder.node("option", {value: "20px"}, [document.createTextNode("20")]));
			opcoes.push(Builder.node("option", {value: "22px"}, [document.createTextNode("22")]));
			opcoes.push(Builder.node("option", {value: "24px"}, [document.createTextNode("24")]));
			opcoes.push(Builder.node("option", {value: "26px"}, [document.createTextNode("26")]));
			opcoes.push(Builder.node("option", {value: "28px"}, [document.createTextNode("28")]));
			opcoes.push(Builder.node("option", {value: "30px"}, [document.createTextNode("30")]));
			opcoes.push(Builder.node("option", {value: "32px"}, [document.createTextNode("32")]));
			opcoes.push(Builder.node("option", {value: "34px"}, [document.createTextNode("34")]));
			opcoes.push(Builder.node("option", {value: "36px"}, [document.createTextNode("36")]));
			opcoes.push(Builder.node("option", {value: "38px"}, [document.createTextNode("38")]));
			opcoes.push(Builder.node("option", {value: "40px"}, [document.createTextNode("40")]));
			opcoes.push(Builder.node("option", {value: "42px"}, [document.createTextNode("42")]));
		}
		if(Prototype.Browser.IE){
			opcoes.push(Builder.node("option", {value: "1", selected: "selected"}, [document.createTextNode("1")]));
			opcoes.push(Builder.node("option", {value: "2"}, [document.createTextNode("2")]));
			opcoes.push(Builder.node("option", {value: "3"}, [document.createTextNode("3")]));
			opcoes.push(Builder.node("option", {value: "4"}, [document.createTextNode("4")]));
			opcoes.push(Builder.node("option", {value: "5"}, [document.createTextNode("5")]));
			opcoes.push(Builder.node("option", {value: "6"}, [document.createTextNode("6")]));
			opcoes.push(Builder.node("option", {value: "7"}, [document.createTextNode("7")]));
		}
		
		
		var select = Builder.node("select", {title: "Tamanho do texto selecionado", style: "height: 15px; margin-left: 5px; font-size: 8px;"}, opcoes);
		Event.observe(select, "change", this.aplicarTamanhoFonte.bindAsEventListener(this));
		this.barraFerramentas.appendChild(this.getDivFerramentas(select));
	},
	/**
	 * Aplicar um novo tamanho ao texto selecionado
	 * @param {Event} event
	 */
	aplicarTamanhoFonte: function(event){
		var select = Event.element(event);
		var tamanho = $(select).getValue();
		this.aplicarTagTextoSelecionado("span", "style=\"font-size: "+tamanho+"\"");
		this.executarComandoIE("FontSize", parseInt(tamanho));
	},
	/**
	 * Gerar combo para trocar a cor do texto selecionado
	 */
	toolColor: function(){
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
		var divCor = Builder.node("div", {style: estiloDivCor}, divColors);
		$(divCor).childElements().each((function(div){
			Event.observe(div, "click", this.aplicarColor.bindAsEventListener(this));
		}).bind(this));
		
		this.barraFerramentas.appendChild(divCor);
		
		var imagem = this.getImageToolBar("fontcolor.gif");
		Event.observe(imagem, "click", this.mostrarCores.bind(this, divCor));
		var tituloBotao = "cor do texto";
		imagem.alt = tituloBotao;
		imagem.title = tituloBotao;
		imagem.firstChild.height = "14";
		imagem.firstChild.width = "21";
		
		
		this.barraFerramentas.appendChild(imagem);
		new PeriodicalExecuter(function(pe){
			divCor.style.marginTop = "16px";
			divCor.style.left = (Prototype.Browser.IE? (imagem.offsetLeft+2): (imagem.offsetLeft-11))+ "px";
			pe.stop();
		}, 1.0);
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
	},
	/**
	 * gerar botão para edição do HTML gerado pelo editor principal
	 */
	toolEditHTML: function(){
		var image = this.getImageToolBar("text-html.png");
		Event.observe(image, "click", this.aplicarEditHTML.bind(this));
		var titulo = "Visualizar o código HTML do texto";
		image.alt = titulo;
		image.title = titulo;
		if(Prototype.Browser.Gecko){
			$(image).setStyle({cssFloat: "right"});
		}
		if(Prototype.Browser.IE){
			$(image).setStyle({styleFloat: "right"});
		}
		this.barraFerramentas.appendChild(image);
	},
	/**
	 * Janela de editar HTML sendo arrastada
	 * @type Draggable
	 */
	janelaSendoArrastada: null,
	/**
	 * abrir janela de edição do HTML gerado pelo editor de texto
	 */
	aplicarEditHTML: function(){
		if(this.getJanelaEditHTML() != null){
			return;
		}
		var estiloBotoes = "border: 1px solid rgb(144, 186, 237); width: 100px; background-color: #ECF6FF;font-weight: bold; color:#7A7A7A; cursor:pointer;";
		var botaoOK = Builder.node("input", {type: "button", value: "OK", id:"ok", title: "Copiar o HTML para a janela principal", style: estiloBotoes});
		var botaoCancelar = Builder.node("input", {type: "button", value: "Cancelar", id: "cancelar", title: "Fechar a janela descartando qualquer alteração", style: estiloBotoes});
		var botaoAtualizarCodigo = Builder.node("input", {type:"checkbox", style: "height: 15px; vertical-align:middle;", id: "atualizarCodigo"});
		
		var imagemMovimentar = Builder.node("img", {
			height: "16", 
			width: "16", 
			src: this.getBasePathImagens("movimentar.png"),
			style: "float: right; cursor: move;",
			alt: "Clique aqui e arraste para movimentar a janela",
			title: "Clique aqui e arraste para movimentar a janela"
		});
		Event.observe(imagemMovimentar, "mousedown", (function(event){
			if(this.janelaSendoArrastada == null){
				var divElement = Event.element(event);
				this.janelaSendoArrastada = new Draggable(divElement.parentNode.parentNode);
				this.janelaSendoArrastada.initDrag(event);	
			}			
		}).bind(this));
		Event.observe(imagemMovimentar, "mouseup", (function(event){
			if(this.janelaSendoArrastada != null){
				this.janelaSendoArrastada.finishDrag(event);
				this.janelaSendoArrastada.destroy();
				this.janelaSendoArrastada = null;
			}
		}).bind(this));
		
		var editHTML = Builder.node("div", {id: "editHTML", style: "position: absolute;top:30px; left: 155px; width: 340px; border: solid 1px gray; background-color: #FBFDFF; z-index: 1000;"},[
			Builder.node("div", [
				Builder.node("label", {style: "font-size: 10px;float:left; color:gray;", htmlFor:"atualizarCodigo"}, [
					botaoAtualizarCodigo,
					document.createTextNode("atualizar a tela com o código ao digitar")
				]),
				imagemMovimentar
			]),
			Builder.node("div", {style: "text-align: center"}, [
				Builder.node("textarea", {style: "width: 339px; border-right: none; border-left:none; border-top:none;border-top: solid 1px gray;border-bottom: solid 1px gray;"}, [
					document.createTextNode(this.getHTML())
				]),
			]),
			Builder.node("div", {style: "text-align: center; margin-bottom: 3px;"}, [
				botaoOK,
				document.createTextNode(" "),
				botaoCancelar
			])
		]);
		editHTML = $(editHTML);
		Event.observe(botaoAtualizarCodigo, "click", this.ativarAtualizarConteudo.bind(this));
		Event.observe(botaoOK, "click", this.botaoOK.bind(this));
		Event.observe(botaoCancelar, "click", this.botaoCancelar.bind(this));
		this.divContainer.appendChild(editHTML);
		this.divContainer.makePositioned();
		
		editHTML.setStyle({
			left:((this.divContainer.getWidth()-editHTML.getWidth())-5)+ "px" 
		});
		editHTML.select("textarea")[0].rows = Math.round((this.divContainer.getHeight()-70)/20);
	},
	/**
	 * Ativar a sincronização do conteúdo HTML da janela de edição do html com 
	 * o editor de texto principal
	 * @param {Event} event
	 */
	ativarAtualizarConteudo: function(event){
		var ativar = Event.element(event).checked;
		var editHTML = this.getJanelaEditHTML();
		var textArea = $(editHTML).select("textarea")[0];
		if(ativar){
			Event.observe(textArea, "keyup", this.copiarConteudo.bindAsEventListener(this));
		}else{
			Event.stopObserving(textArea, "keyup");
		}
	},
	/**
	 * retornar a janela de edição do HTML que estiver aberta
	 * @return a janela de edição do HTML que estiver aberta
	 * @type HTMLDivElement
	 */
	getJanelaEditHTML: function(){
		var edi = this.divContainer.select("div[id=\"editHTML\"]");
		if(edi.length != 0){
			return edi[0];
		}
		return null;
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
		var editHTML = this.getJanelaEditHTML();
		editHTML.remove();
	},
	/**
	 * Copiar o conteúdo da janela de edição do html para o editor
	 */
	copiarConteudo: function(){
		var editHTML = this.getJanelaEditHTML();
		var html = $(editHTML.select("textarea")[0]).getValue();
		this.setHTML(html);
	},
	/**
	 * botão ok da janela de edição do HTML
	 */
	botaoOK: function(){
		this.copiarConteudo();
		this.fecharEditHTML();
	},
	/**
	 * Aplicar uma cor ao texto selecionado
	 * @param {Event} event
	 */
	aplicarColor: function(event){
		var div = Event.element(event);
		var cor = div.style.backgroundColor;
		this.aplicarTagTextoSelecionado("span", "style=\"color: "+cor+"\"");
		this.executarComandoIE("ForeColor", cor);
		this.mostrarCores();
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
		this.getEditArea().innerHTML = html;
		if(Prototype.Browser.Gecko){
			this.html = html;
			this.corrigirPathImagens();
		}
	},
	/**
	 * Corrigir os paths das imagens adicionando o base href (bug do firefox
	 * que não reconhece a tag <base href=""> dinamicamente)
	 */
	corrigirPathImagens: function(){
		if(Prototype.Browser.Gecko){
			var images = $A(this.getEditArea().getElementsByTagName("img"));
			var path = window.location.href.substring(0, window.location.href.lastIndexOf("/", window.location.href.length)) +"/";
			
			images.each(function(image){
				if(image.src.indexOf(path) == -1){
					image.src = path+image.src;
				}
			});
		}
	},
	/**
	 * retornar texto html produzido pelo usuário
	 * @return texto html produzido pelo usuário
	 * @type String
	 */
	getHTML: function(){
		if(Prototype.Browser.IE){
			return this.editArea.innerHTML;
		}
		if(Prototype.Browser.Gecko){
			return this.getEditArea().innerHTML;
		}
		return null;
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
	 * Executar um comando do IE
	 * 
	 * @param {String} comando
	 * @param {Object} values
	 */
	executarComandoIE: function(comando, values){
		var range = new WrapperTextRange(this.editArea);
		if(Prototype.Browser.IE && range.getHTMLText() != null && !range.getHTMLText().blank()){
			if(values != undefined){
				document.execCommand(comando, false, values);
			}else{
				range.execCommand(comando);
			}
		}
	},
	/**
	 * aplicar uma tag ao texto selecionado no editor
	 * 
	 * @param {String} tag
	 * @param {String} atributos 
	 */
	aplicarTagTextoSelecionado: function(tag, atributos){
		if(Prototype.Browser.Gecko){
			var range = new WrapperTextRange(this.editArea);
			var elemento = null;
			if(atributos == undefined){
				elemento = Builder.node(tag);
			}else{
				var attrs = this.parseAtributos(atributos);
				elemento = Builder.node(tag, attrs);
			}
			range.surroundContents(elemento);
		}
	},
	/**
	 * 
	 * @param {String} atributos
	 * @return hash com os atributos
	 * @type Object
	 */
	parseAtributos: function(atributos){
		var attrs = atributos.toQueryParams("\" ");
		Object.keys(attrs).each(function(key){
			attrs[key] = attrs[key].replace(/"/g, ""); 
		});
		return attrs;
	},
	/**
	 * busca case-insensitive
	 * 
	 * @param {String} texto
	 * @param {String} valorProcurado
	 * @return verificação do texto conferindo ou não com o valor procurado
	 * @type Boolean
	 */
	_encontrado: function(texto, valorProcurado){
		var regular = new RegExp(".*"+valorProcurado+".*", "i");
		return texto.match(regular); 
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
		return Builder.node("div", {style: "margin-left: 5px; float: left; height: 20px;"},[encobrir]);
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