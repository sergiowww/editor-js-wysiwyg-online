# Editor Javascript Online WYSIWYG (What You See Is What You Get)

Desenvolvido com PrototypeJS e Scriptaculous 

[Exemplo Editor JS Online](http://sergiowww.github.io/editor-js-wysiwyg-online/)

### Como usar na sua página?
- Defina uma div com altura e largura no corpo da sua página e forneça um id para ela;
- Acrescente os scripts do prototype e scriptaculous na sua página
- instancie a classe `new TextEditor("id_da_div_criada")` ao carregar a página (onload)

Como no exemplo abaixo:
```
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title>Teste do editor de textos</title>
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/prototype/1.6.0.3/prototype.js"></script>
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/scriptaculous/1.8.2/scriptaculous.js"></script>
<script type="text/javascript" src="editor/editor.js"></script>

</head>
<body onload="new TextEditor('textoCorpoEditavel');">
<div style="height: 400px; width: 830px;" id="textoCorpoEditavel"></div>
</body>
</html>
```

### Online web text-editor Features

- bold;
- italic;
- underline;
- alignment (center, left, right);
- Font face (Arial, Times, Verdana, Courier New, Comic Sans MS);
- Font size;
- Font color;
- Header and footer (for PDF generation)

Very simple and useful editor, it needs to be improved a lot in terms of features, but it works for basic text-formatting. I've developed to allow users to create formatted e-mail messages and letter templates, not a big deal at all. It works in all browsers.

[Online Live Example](http://sergiowww.github.io/editor-js-wysiwyg-online/)

Generate PDF from HTML http://www.ohloh.net/p/xhtmlrenderer
