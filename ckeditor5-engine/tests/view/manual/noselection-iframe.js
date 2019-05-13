/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* globals document */

import View from '../../../src/view/view';
import { setData } from '../../../src/dev-utils/view';
import createViewRoot from '../_utils/createroot';

const iframe = document.getElementById( 'iframe' );
iframe.srcdoc = '<div contenteditable="true" id="editor"></div>';

iframe.addEventListener( 'load', () => {
	const view = new View();
	const viewDocument = view.document;
	createViewRoot( viewDocument );

	view.attachDomRoot( iframe.contentWindow.document.getElementById( 'editor' ) );

	setData( view,
		'<container:p>foo</container:p>' +
		'<container:p>bar</container:p>'
	);
} );
