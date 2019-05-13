/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* globals console, document */

import View from '../../../src/view/view';
import { setData } from '../../../src/dev-utils/view';
import createViewRoot from '../_utils/createroot';

const view = new View();
const viewDocument = view.document;
createViewRoot( viewDocument );
view.attachDomRoot( document.getElementById( 'editor' ) );

setData( view,
	'<container:p><attribute:b>foo</attribute:b>bar</container:p>' +
	'<container:p>bom</container:p>' );

viewDocument.on( 'selectionChange', ( evt, data ) => {
	console.log( 'selectionChange', data );
	view.change( writer => writer.setSelection( data.newSelection ) );
} );

viewDocument.on( 'selectionChangeDone', ( evt, data ) => {
	console.log( '%c selectionChangeDone ', 'background: #222; color: #bada55', data );
	view.change( writer => writer.setSelection( data.newSelection ) );
} );
