/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* globals document */

import EditingView from '@ckeditor/ckeditor5-engine/src/view/view';
import ViewRootEditableElement from '@ckeditor/ckeditor5-engine/src/view/rooteditableelement';
import EditableUIView from '../../src/editableui/editableuiview';
import View from '../../src/view';
import Locale from '@ckeditor/ckeditor5-utils/src/locale';
import testUtils from '@ckeditor/ckeditor5-core/tests/_utils/utils';

describe( 'EditableUIView', () => {
	let view, editableElement, editingView, editingViewRoot, locale;

	testUtils.createSinonSandbox();

	beforeEach( () => {
		locale = new Locale( 'en' );
		editableElement = document.createElement( 'div' );

		editingView = new EditingView();
		editingViewRoot = new ViewRootEditableElement( 'div' );
		editingViewRoot._document = editingView.document;
		editingView.document.roots.add( editingViewRoot );
		view = new EditableUIView( locale, editingView );
		view.name = editingViewRoot.rootName;

		view.render();
	} );

	describe( 'constructor()', () => {
		it( 'sets initial values of attributes', () => {
			view = new EditableUIView( locale, editingView );

			expect( view.isFocused ).to.be.false;
			expect( view.name ).to.be.null;
			expect( view._externalElement ).to.be.undefined;
			expect( view._editingView ).to.equal( editingView );
		} );

		it( 'renders element from template when no editableElement', () => {
			expect( view.element ).to.equal( view._editableElement );
			expect( view.element.classList.contains( 'ck' ) ).to.be.true;
			expect( view.element.classList.contains( 'ck-content' ) ).to.be.true;
			expect( view.element.classList.contains( 'ck-editor__editable' ) ).to.be.true;
			expect( view.element.classList.contains( 'ck-rounded-corners' ) ).to.be.true;
			expect( view._externalElement ).to.be.undefined;
			expect( view.isRendered ).to.be.true;
		} );

		it( 'accepts editableElement as an argument', () => {
			view = new EditableUIView( locale, editingView, editableElement );
			view.name = editingViewRoot.rootName;

			view.render();
			expect( view.element ).to.equal( editableElement );
			expect( view.element ).to.equal( view._editableElement );
			expect( view.element.classList.contains( 'ck' ) ).to.be.true;
			expect( view.element.classList.contains( 'ck-editor__editable' ) ).to.be.true;
			expect( view.element.classList.contains( 'ck-rounded-corners' ) ).to.be.true;
			expect( view._hasExternalElement ).to.be.true;
			expect( view.isRendered ).to.be.true;
		} );
	} );

	describe( 'View bindings', () => {
		describe( 'class', () => {
			it( 'reacts on view#isFocused', () => {
				view.isFocused = true;

				expect( editingViewRoot.hasClass( 'ck-focused' ) ).to.be.true;
				expect( editingViewRoot.hasClass( 'ck-blurred' ) ).to.be.false;

				view.isFocused = false;
				expect( editingViewRoot.hasClass( 'ck-focused' ) ).to.be.false;
				expect( editingViewRoot.hasClass( 'ck-blurred' ) ).to.be.true;
			} );

			// https://github.com/ckeditor/ckeditor5/issues/1530.
			// https://github.com/ckeditor/ckeditor5/issues/1676.
			it( 'should work when update is handled during the rendering phase', () => {
				const secondEditingViewRoot = new ViewRootEditableElement( 'div' );
				const secondView = new EditableUIView( locale, editingView );
				const secondEditableElement = document.createElement( 'div' );

				document.body.appendChild( secondEditableElement );

				secondEditingViewRoot.rootName = 'second';
				secondEditingViewRoot._document = editingView.document;
				editingView.document.roots.add( secondEditingViewRoot );

				secondView.name = 'second';
				secondView.render();

				editingView.attachDomRoot( editableElement, 'main' );
				editingView.attachDomRoot( secondEditableElement, 'second' );

				view.isFocused = true;
				secondView.isFocused = false;

				expect( editingViewRoot.hasClass( 'ck-focused' ), 1 ).to.be.true;
				expect( editingViewRoot.hasClass( 'ck-blurred' ), 2 ).to.be.false;
				expect( secondEditingViewRoot.hasClass( 'ck-focused' ), 3 ).to.be.false;
				expect( secondEditingViewRoot.hasClass( 'ck-blurred' ), 4 ).to.be.true;

				editingView.isRenderingInProgress = true;
				view.isFocused = false;
				secondView.isFocused = true;

				expect( editingViewRoot.hasClass( 'ck-focused' ), 5 ).to.be.true;
				expect( editingViewRoot.hasClass( 'ck-blurred' ), 6 ).to.be.false;
				expect( secondEditingViewRoot.hasClass( 'ck-focused' ), 7 ).to.be.false;
				expect( secondEditingViewRoot.hasClass( 'ck-blurred' ), 8 ).to.be.true;

				editingView.isRenderingInProgress = false;

				expect( editingViewRoot.hasClass( 'ck-focused' ), 9 ).to.be.false;
				expect( editingViewRoot.hasClass( 'ck-blurred' ), 10 ).to.be.true;
				expect( secondEditingViewRoot.hasClass( 'ck-focused' ), 11 ).to.be.true;
				expect( secondEditingViewRoot.hasClass( 'ck-blurred' ), 12 ).to.be.false;

				secondEditableElement.remove();
			} );
		} );
	} );

	describe( 'destroy()', () => {
		it( 'calls super#destroy()', () => {
			const spy = testUtils.sinon.spy( View.prototype, 'destroy' );

			view.destroy();
			sinon.assert.calledOnce( spy );
		} );

		it( 'can be called multiple times', () => {
			expect( () => {
				view.destroy();
				view.destroy();
			} ).to.not.throw();
		} );

		describe( 'when #editableElement as an argument', () => {
			it( 'reverts the template of editableElement', () => {
				editableElement = document.createElement( 'div' );
				editableElement.classList.add( 'foo' );
				editableElement.contentEditable = false;

				view = new EditableUIView( locale, editingView, editableElement );
				view.name = editingViewRoot.rootName;

				view.render();
				view.destroy();
				expect( view.element.classList.contains( 'ck' ) ).to.be.false;
				expect( view.element.classList.contains( 'foo' ) ).to.be.true;
			} );
		} );
	} );
} );
