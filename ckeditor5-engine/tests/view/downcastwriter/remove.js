/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import DowncastWriter from '../../../src/view/downcastwriter';
import ContainerElement from '../../../src/view/containerelement';
import Range from '../../../src/view/range';
import DocumentFragment from '../../../src/view/documentfragment';
import { stringify, parse } from '../../../src/dev-utils/view';
import AttributeElement from '../../../src/view/attributeelement';
import EmptyElement from '../../../src/view/emptyelement';
import UIElement from '../../../src/view/uielement';
import CKEditorError from '@ckeditor/ckeditor5-utils/src/ckeditorerror';
import Document from '../../../src/view/document';

describe( 'DowncastWriter', () => {
	describe( 'remove()', () => {
		let writer;

		// Executes test using `parse` and `stringify` utils functions. Uses range delimiters `[]{}` to create and
		// test ranges.
		//
		// @param {String} input
		// @param {String} expectedResult
		// @param {String} expectedRemoved
		// @param {Boolean} asItem
		function test( input, expectedResult, expectedRemoved, asItem = false ) {
			const { view, selection } = parse( input );

			const range = selection.getFirstRange();
			const rangeOrItem = asItem ? Array.from( range.getItems() )[ 0 ] : range;
			const removed = writer.remove( rangeOrItem );

			expect( stringify( view, asItem ? null : range, { showType: true, showPriority: true } ) ).to.equal( expectedResult );
			expect( stringify( removed, null, { showType: true, showPriority: true } ) ).to.equal( expectedRemoved );
		}

		before( () => {
			writer = new DowncastWriter( new Document() );
		} );

		it( 'should throw when range placed in two containers', () => {
			const p1 = new ContainerElement( 'p' );
			const p2 = new ContainerElement( 'p' );

			expect( () => {
				writer.remove( Range._createFromParentsAndOffsets( p1, 0, p2, 0 ) );
			} ).to.throw( CKEditorError, 'view-writer-invalid-range-container' );
		} );

		it( 'should throw when range has no parent container', () => {
			const el = new AttributeElement( 'b' );

			expect( () => {
				writer.remove( Range._createFromParentsAndOffsets( el, 0, el, 0 ) );
			} ).to.throw( CKEditorError, 'view-writer-invalid-range-container' );
		} );

		it( 'should return empty DocumentFragment when range is collapsed', () => {
			const p = new ContainerElement( 'p' );
			const range = Range._createFromParentsAndOffsets( p, 0, p, 0 );
			const fragment = writer.remove( range );

			expect( fragment ).to.be.instanceof( DocumentFragment );
			expect( fragment.childCount ).to.equal( 0 );
			expect( range.isCollapsed ).to.be.true;
		} );

		it( 'should remove single text node', () => {
			test( '<container:p>[foobar]</container:p>', '<container:p>[]</container:p>', 'foobar' );
		} );

		it( 'should not leave empty text nodes', () => {
			test( '<container:p>{foobar}</container:p>', '<container:p>[]</container:p>', 'foobar' );
		} );

		it( 'should remove part of the text node', () => {
			test( '<container:p>f{oob}ar</container:p>', '<container:p>f{}ar</container:p>', 'oob' );
		} );

		it( 'should remove parts of nodes #1', () => {
			test(
				'<container:p>f{oo<attribute:b view-priority="10">ba}r</attribute:b></container:p>',
				'<container:p>f[]<attribute:b view-priority="10">r</attribute:b></container:p>',
				'oo<attribute:b view-priority="10">ba</attribute:b>'
			);
		} );

		it( 'should support unicode', () => {
			test(
				'<container:p>நி{லை<attribute:b view-priority="10">க்}கு</attribute:b></container:p>',
				'<container:p>நி[]<attribute:b view-priority="10">கு</attribute:b></container:p>',
				'லை<attribute:b view-priority="10">க்</attribute:b>'
			);
		} );

		it( 'should merge after removing #1', () => {
			test(
				'<container:p>' +
					'<attribute:b view-priority="1">foo</attribute:b>[bar]<attribute:b view-priority="1">bazqux</attribute:b>' +
				'</container:p>',
				'<container:p><attribute:b view-priority="1">foo{}bazqux</attribute:b></container:p>',
				'bar'
			);
		} );

		it( 'should merge after removing #2', () => {
			test(
				'<container:p>' +
					'<attribute:b view-priority="1">fo{o</attribute:b>bar<attribute:b view-priority="1">ba}zqux</attribute:b>' +
				'</container:p>',
				'<container:p><attribute:b view-priority="1">fo{}zqux</attribute:b></container:p>',
				'<attribute:b view-priority="1">o</attribute:b>bar<attribute:b view-priority="1">ba</attribute:b>'
			);
		} );

		it( 'should remove part of the text node in document fragment', () => {
			test( 'fo{ob}ar', 'fo{}ar', 'ob' );
		} );

		it( 'should remove EmptyElement', () => {
			test(
				'<container:p>foo[<empty:img></empty:img>]bar</container:p>',
				'<container:p>foo{}bar</container:p>',
				'<empty:img></empty:img>'
			);
		} );

		it( 'should throw if range is placed inside EmptyElement', () => {
			const emptyElement = new EmptyElement( 'img' );
			const attributeElement = new AttributeElement( 'b' );
			new ContainerElement( 'p', null, [ emptyElement, attributeElement ] ); // eslint-disable-line no-new
			const range = Range._createFromParentsAndOffsets( emptyElement, 0, attributeElement, 0 );

			expect( () => {
				writer.remove( range );
			} ).to.throw( CKEditorError, 'view-writer-cannot-break-empty-element' );
		} );

		it( 'should remove UIElement', () => {
			test(
				'<container:p>foo[<ui:span></ui:span>]bar</container:p>',
				'<container:p>foo{}bar</container:p>',
				'<ui:span></ui:span>'
			);
		} );

		it( 'should throw if range is placed inside UIElement', () => {
			const uiElement = new UIElement( 'span' );
			const attributeElement = new AttributeElement( 'b' );
			new ContainerElement( 'p', null, [ uiElement, attributeElement ] ); // eslint-disable-line no-new
			const range = Range._createFromParentsAndOffsets( uiElement, 0, attributeElement, 0 );

			expect( () => {
				writer.remove( range );
			} ).to.throw( CKEditorError, 'view-writer-cannot-break-ui-element' );
		} );

		it( 'should remove single text node (as item)', () => {
			test( '<container:p>[foobar]</container:p>', '<container:p></container:p>', 'foobar', true );
		} );

		it( 'should not leave empty text nodes (as item)', () => {
			test( '<container:p>{foobar}</container:p>', '<container:p></container:p>', 'foobar', true );
		} );

		it( 'should remove part of the text node (as item)', () => {
			test( '<container:p>f{oob}ar</container:p>', '<container:p>far</container:p>', 'oob', true );
		} );

		it( 'should merge after removing (as item)', () => {
			test(
				'<container:p>' +
					'<attribute:b view-priority="1">foo</attribute:b>[bar]<attribute:b view-priority="1">bazqux</attribute:b>' +
				'</container:p>',
				'<container:p><attribute:b view-priority="1">foobazqux</attribute:b></container:p>',
				'bar',
				true
			);
		} );

		it( 'should remove EmptyElement (as item)', () => {
			test(
				'<container:p>foo[<empty:img></empty:img>]bar</container:p>',
				'<container:p>foobar</container:p>',
				'<empty:img></empty:img>',
				true
			);
		} );

		it( 'should remove UIElement (as item)', () => {
			test(
				'<container:p>foo[<ui:span></ui:span>]bar</container:p>',
				'<container:p>foobar</container:p>',
				'<ui:span></ui:span>',
				true
			);
		} );

		it( 'should throw when item has no parent container', () => {
			const el = new AttributeElement( 'b' );

			expect( () => {
				writer.remove( el );
			} ).to.throw( CKEditorError, 'view-position-before-root' );
		} );
	} );
} );
