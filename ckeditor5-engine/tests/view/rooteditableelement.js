/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import ContainerElement from '../../src/view/containerelement';
import EditableElement from '../../src/view/editableelement';
import RootEditableElement from '../../src/view/rooteditableelement';

import createDocumentMock from '../../tests/view/_utils/createdocumentmock';

describe( 'RootEditableElement', () => {
	describe( 'constructor()', () => {
		it( 'should create an element with default root name', () => {
			const root = new RootEditableElement( 'div' );
			root._document = createDocumentMock();

			expect( root ).to.be.instanceof( EditableElement );
			expect( root ).to.be.instanceof( ContainerElement );

			expect( root.rootName ).to.equal( 'main' );
			expect( root.name ).to.equal( 'div' );

			expect( root.isFocused ).to.be.false;
			expect( root.isReadOnly ).to.be.false;
		} );

		it( 'should create an element with custom root name', () => {
			const root = new RootEditableElement( 'h1' );
			root._document = createDocumentMock();
			root.rootName = 'header';

			expect( root.rootName ).to.equal( 'header' );
			expect( root.name ).to.equal( 'h1' );

			expect( root.isFocused ).to.be.false;
			expect( root.isReadOnly ).to.be.false;
		} );
	} );

	describe( 'is', () => {
		let el;

		before( () => {
			el = new RootEditableElement( 'div' );
		} );

		it( 'should return true for rootElement/containerElement/editable/element, also with correct name and element name', () => {
			expect( el.is( 'rootElement' ) ).to.be.true;
			expect( el.is( 'rootElement', 'div' ) ).to.be.true;
			expect( el.is( 'containerElement' ) ).to.be.true;
			expect( el.is( 'containerElement', 'div' ) ).to.be.true;
			expect( el.is( 'editableElement' ) ).to.be.true;
			expect( el.is( 'editableElement', 'div' ) ).to.be.true;
			expect( el.is( 'element' ) ).to.be.true;
			expect( el.is( 'element', 'div' ) ).to.be.true;
			expect( el.is( 'div' ) ).to.be.true;
		} );

		it( 'should return false for other accept values', () => {
			expect( el.is( 'rootElement', 'p' ) ).to.be.false;
			expect( el.is( 'containerElement', 'p' ) ).to.be.false;
			expect( el.is( 'element', 'p' ) ).to.be.false;
			expect( el.is( 'p' ) ).to.be.false;
			expect( el.is( 'text' ) ).to.be.false;
			expect( el.is( 'textProxy' ) ).to.be.false;
			expect( el.is( 'attributeElement' ) ).to.be.false;
			expect( el.is( 'uiElement' ) ).to.be.false;
			expect( el.is( 'emptyElement' ) ).to.be.false;
			expect( el.is( 'documentFragment' ) ).to.be.false;
		} );
	} );

	describe( '_name', () => {
		it( 'should set new name to element', () => {
			const el = new RootEditableElement( '$root' );

			expect( el.name ).to.equal( '$root' );

			el._name = 'div';

			expect( el.name ).to.equal( 'div' );
		} );
	} );

	it( 'should be cloned properly', () => {
		const root = new RootEditableElement( 'h1' );
		root._document = createDocumentMock();
		root.rootName = 'header';

		const newRoot = root._clone();

		expect( newRoot._document ).to.equal( root._document );
		expect( newRoot.rootName ).to.equal( root.rootName );
	} );
} );
