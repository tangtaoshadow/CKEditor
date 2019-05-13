/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* global console, document */

import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';

import bindTwoStepCaretToAttribute from '../../../../src/utils/bindtwostepcarettoattribute';

ClassicEditor
	.create( document.querySelector( '#editor' ), {
		plugins: [ Essentials, Paragraph, Bold, Italic ],
		toolbar: [ 'undo', 'redo', '|', 'bold', 'italic' ]
	} )
	.then( editor => {
		const bold = editor.plugins.get( Bold );

		bindTwoStepCaretToAttribute( editor.editing.view, editor.model, bold, 'bold' );
	} )
	.catch( err => {
		console.error( err.stack );
	} );
