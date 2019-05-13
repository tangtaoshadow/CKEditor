/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import DowncastWriter from '../../../src/view/downcastwriter';
import { stringify, parse } from '../../../src/dev-utils/view';
import ContainerElement from '../../../src/view/containerelement';
import AttributeElement from '../../../src/view/attributeelement';
import RootEditableElement from '../../../src/view/rooteditableelement';
import EmptyElement from '../../../src/view/emptyelement';
import UIElement from '../../../src/view/uielement';
import Range from '../../../src/view/range';
import Position from '../../../src/view/position';
import CKEditorError from '@ckeditor/ckeditor5-utils/src/ckeditorerror';
import Document from '../../../src/view/document';
import Mapper from '../../../src/conversion/mapper';

describe( 'DowncastWriter', () => {
	describe( 'move()', () => {
		let writer;

		// Executes test using `parse` and `stringify` utils functions. Uses range delimiters `[]{}` to create and
		// test ranges.
		//
		// @param {String} input
		// @param {String} expectedResult
		// @param {String} expectedRemoved
		function test( source, destination, sourceAfterMove, destinationAfterMove ) {
			const { view: srcView, selection: srcSelection } = parse( source );
			const { view: dstView, selection: dstSelection } = parse( destination );

			const newRange = writer.move( srcSelection.getFirstRange(), dstSelection.getFirstPosition() );

			expect( stringify( dstView, newRange, { showType: true, showPriority: true } ) ).to.equal( destinationAfterMove );
			expect( stringify( srcView, null, { showType: true, showPriority: true } ) ).to.equal( sourceAfterMove );
		}

		before( () => {
			writer = new DowncastWriter( new Document() );
		} );

		it( 'should move single text node', () => {
			test(
				'<container:p>[foobar]</container:p>',
				'<container:p>[]</container:p>',
				'<container:p></container:p>',
				'<container:p>[foobar]</container:p>'
			);
		} );

		it( 'should not leave empty text nodes', () => {
			test(
				'<container:p>{foobar}</container:p>',
				'<container:p>[]</container:p>',
				'<container:p></container:p>',
				'<container:p>[foobar]</container:p>'
			);
		} );

		it( 'should move part of the text node', () => {
			test(
				'<container:p>f{oob}ar</container:p>',
				'<container:p>[]</container:p>',
				'<container:p>far</container:p>',
				'<container:p>[oob]</container:p>'
			);
		} );

		it( 'should support unicode', () => {
			test(
				'<container:p>நி{லை}க்கு</container:p>',
				'<container:p>நி{}கு</container:p>',
				'<container:p>நிக்கு</container:p>',
				'<container:p>நி{லை}கு</container:p>'
			);
		} );

		it( 'should move parts of nodes', () => {
			test(
				'<container:p>f{oo<attribute:b view-priority="10">ba}r</attribute:b></container:p>',
				'<container:p>[]<attribute:b view-priority="10">qux</attribute:b></container:p>',
				'<container:p>f<attribute:b view-priority="10">r</attribute:b></container:p>',
				'<container:p>[oo<attribute:b view-priority="10">ba}qux</attribute:b></container:p>'
			);
		} );

		it( 'should merge after moving #1', () => {
			test(
				'<container:p>' +
					'<attribute:b view-priority="1">foo</attribute:b>[bar]<attribute:b view-priority="1">bazqux</attribute:b>' +
				'</container:p>',
				'<container:p><attribute:b view-priority="1">foo{}bazqux</attribute:b></container:p>',
				'<container:p><attribute:b view-priority="1">foobazqux</attribute:b></container:p>',
				'<container:p>' +
					'<attribute:b view-priority="1">foo</attribute:b>[bar]<attribute:b view-priority="1">bazqux</attribute:b>' +
				'</container:p>'
			);
		} );

		it( 'should merge after moving #2', () => {
			test(
				'<container:p>' +
					'<attribute:b view-priority="1">fo{o</attribute:b>bar<attribute:b view-priority="1">ba}zqux</attribute:b>' +
				'</container:p>',
				'<container:p><attribute:b view-priority="1">fo{}zqux</attribute:b></container:p>',
				'<container:p><attribute:b view-priority="1">fozqux</attribute:b></container:p>',
				'<container:p>' +
					'<attribute:b view-priority="1">fo{o</attribute:b>bar<attribute:b view-priority="1">ba}zqux</attribute:b>' +
				'</container:p>'
			);
		} );

		it( 'should move part of the text node in document fragment', () => {
			test( 'fo{ob}ar', 'fo{}ar', 'foar', 'fo{ob}ar' );
		} );

		it( 'should correctly move text nodes inside same parent', () => {
			const { view, selection } = parse( '<container:p>[<attribute:b>a</attribute:b>]b<attribute:b>c</attribute:b></container:p>' );

			const newRange = writer.move( selection.getFirstRange(), Position._createAt( view, 2 ) );

			const expectedView = '<container:p>b[<attribute:b>a}c</attribute:b></container:p>';
			expect( stringify( view, newRange, { showType: true } ) ).to.equal( expectedView );
		} );

		it( 'should correctly move text nodes inside same container', () => {
			const { view, selection } = parse(
				'<container:p><attribute:b>a{b</attribute:b>xx<attribute:b>c}d</attribute:b>yy</container:p>'
			);

			const viewText = view.getChild( 3 );
			const newRange = writer.move( selection.getFirstRange(), Position._createAt( viewText, 1 ) );

			expect( stringify( view, newRange, { showType: true } ) ).to.equal(
				'<container:p><attribute:b>ad</attribute:b>y[<attribute:b>b</attribute:b>xx<attribute:b>c</attribute:b>]y</container:p>'
			);
		} );

		it( 'should move EmptyElement', () => {
			test(
				'<container:p>foo[<empty:img></empty:img>]bar</container:p>',
				'<container:div>baz{}quix</container:div>',
				'<container:p>foobar</container:p>',
				'<container:div>baz[<empty:img></empty:img>]quix</container:div>'
			);
		} );

		it( 'should throw if trying to move to EmptyElement', () => {
			const srcAttribute = new AttributeElement( 'b' );
			const srcContainer = new ContainerElement( 'p', null, srcAttribute );
			const srcRange = Range._createFromParentsAndOffsets( srcContainer, 0, srcContainer, 1 );

			const dstEmpty = new EmptyElement( 'img' );
			new ContainerElement( 'p', null, dstEmpty ); // eslint-disable-line no-new
			const dstPosition = new Position( dstEmpty, 0 );

			expect( () => {
				writer.move( srcRange, dstPosition );
			} ).to.throw( CKEditorError, 'view-writer-cannot-break-empty-element' );
		} );

		it( 'should move UIElement', () => {
			test(
				'<container:p>foo[<ui:span></ui:span>]bar</container:p>',
				'<container:div>baz{}quix</container:div>',
				'<container:p>foobar</container:p>',
				'<container:div>baz[<ui:span></ui:span>]quix</container:div>'
			);
		} );

		it( 'should throw if trying to move to UIElement', () => {
			const srcAttribute = new AttributeElement( 'b' );
			const srcContainer = new ContainerElement( 'p', null, srcAttribute );
			const srcRange = Range._createFromParentsAndOffsets( srcContainer, 0, srcContainer, 1 );

			const dstUI = new UIElement( 'span' );
			new ContainerElement( 'p', null, dstUI ); // eslint-disable-line no-new
			const dstPosition = new Position( dstUI, 0 );

			expect( () => {
				writer.move( srcRange, dstPosition );
			} ).to.throw( CKEditorError, 'view-writer-cannot-break-ui-element' );
		} );

		it( 'should not break marker mappings if marker element was split and the original element was removed', () => {
			const mapper = new Mapper();

			const srcContainer = new ContainerElement( 'p' );
			const dstContainer = new ContainerElement( 'p' );

			const root = new RootEditableElement( 'div' );
			root._appendChild( [ srcContainer, dstContainer ] );

			const attrElemA = new AttributeElement( 'span' );
			attrElemA._id = 'foo';

			const attrElemB = new AttributeElement( 'span' );
			attrElemB._id = 'foo';

			writer.insert( new Position( srcContainer, 0 ), [ attrElemA, attrElemB ] );

			mapper.bindElementToMarker( attrElemA, 'foo' );

			expect( mapper.markerNameToElements( 'foo' ).size ).to.equal( 2 );

			writer.remove( writer.createRangeOn( attrElemA ) );

			expect( mapper.markerNameToElements( 'foo' ).size ).to.equal( 1 );

			writer.move( writer.createRangeOn( attrElemB ), new Position( dstContainer, 0 ) );

			expect( mapper.markerNameToElements( 'foo' ).size ).to.equal( 1 );
		} );
	} );
} );
