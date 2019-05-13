/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import DowncastWriter from '../../../src/view/downcastwriter';
import Element from '../../../src/view/element';
import ContainerElement from '../../../src/view/containerelement';
import AttributeElement from '../../../src/view/attributeelement';
import EmptyElement from '../../../src/view/emptyelement';
import UIElement from '../../../src/view/uielement';
import Position from '../../../src/view/position';
import Range from '../../../src/view/range';
import Text from '../../../src/view/text';
import CKEditorError from '@ckeditor/ckeditor5-utils/src/ckeditorerror';
import { stringify, parse } from '../../../src/dev-utils/view';
import Document from '../../../src/view/document';

describe( 'DowncastWriter', () => {
	describe( 'unwrap()', () => {
		let writer;

		// Executes test using `parse` and `stringify` utils functions.
		//
		// @param {String} input
		// @param {String} unwrapAttribute
		// @param {String} expected
		function test( input, unwrapAttribute, expected ) {
			const { view, selection } = parse( input );

			const newRange = writer.unwrap( selection.getFirstRange(), parse( unwrapAttribute ) );
			expect( stringify( view.root, newRange, { showType: true, showPriority: true } ) ).to.equal( expected );
		}

		before( () => {
			writer = new DowncastWriter( new Document() );
		} );

		it( 'should do nothing on collapsed ranges', () => {
			test(
				'<container:p>f{}oo</container:p>',
				'<attribute:b view-priority="10"></attribute:b>',
				'<container:p>f{}oo</container:p>'
			);
		} );

		it( 'should do nothing on single text node', () => {
			test(
				'<container:p>[foobar]</container:p>',
				'<attribute:b view-priority="1"></attribute:b>',
				'<container:p>[foobar]</container:p>'
			);
		} );

		it( 'should throw error when element is not instance of AttributeElement', () => {
			const container = new ContainerElement( 'p', null, new AttributeElement( 'b', null, new Text( 'foo' ) ) );
			const range = new Range(
				new Position( container, 0 ),
				new Position( container, 1 )
			);
			const b = new Element( 'b' );

			expect( () => {
				writer.unwrap( range, b );
			} ).to.throw( CKEditorError, 'view-writer-unwrap-invalid-attribute' );
		} );

		it( 'should throw error when range placed in two containers', () => {
			const container1 = new ContainerElement( 'p' );
			const container2 = new ContainerElement( 'p' );
			const range = new Range(
				new Position( container1, 0 ),
				new Position( container2, 1 )
			);
			const b = new AttributeElement( 'b' );

			expect( () => {
				writer.unwrap( range, b );
			} ).to.throw( CKEditorError, 'view-writer-invalid-range-container' );
		} );

		it( 'should throw when range has no parent container', () => {
			const el = new AttributeElement( 'b' );
			const b = new AttributeElement( 'b' );

			expect( () => {
				writer.unwrap( Range._createFromParentsAndOffsets( el, 0, el, 0 ), b );
			} ).to.throw( CKEditorError, 'view-writer-invalid-range-container' );
		} );

		it( 'should unwrap single node', () => {
			test(
				'<container:p>[<attribute:b view-priority="1">foobar</attribute:b>]</container:p>',
				'<attribute:b view-priority="1"></attribute:b>',
				'<container:p>[foobar]</container:p>'
			);
		} );

		it( 'should not unwrap attributes with different priorities #1', () => {
			test(
				'<container:p>[<attribute:b view-priority="1">foobar</attribute:b>]</container:p>',
				'<attribute:b view-priority="2"></attribute:b>',
				'<container:p>[<attribute:b view-priority="1">foobar</attribute:b>]</container:p>'
			);
		} );

		it( 'should not unwrap attributes with different priorities #2', () => {
			test(
				'<container:p>' +
				'[' +
					'<attribute:b view-priority="2">foo</attribute:b>' +
					'<attribute:b view-priority="1">bar</attribute:b>' +
					'<attribute:b view-priority="2">baz</attribute:b>' +
				']' +
				'</container:p>',
				'<attribute:b view-priority="2"></attribute:b>',
				'<container:p>[foo<attribute:b view-priority="1">bar</attribute:b>baz]</container:p>'
			);
		} );

		it( 'should unwrap part of the node', () => {
			test(
				'<container:p>[baz<attribute:b view-priority="1">foo}bar</attribute:b></container:p>',
				'<attribute:b view-priority="1"></attribute:b>',
				'<container:p>[bazfoo]<attribute:b view-priority="1">bar</attribute:b></container:p>'
			);
		} );

		it( 'should support unicode', () => {
			test(
				'<container:p>[நிலை<attribute:b view-priority="1">க்}கு</attribute:b></container:p>',
				'<attribute:b view-priority="1"></attribute:b>',
				'<container:p>[நிலைக்]<attribute:b view-priority="1">கு</attribute:b></container:p>'
			);
		} );

		it( 'should unwrap nested attributes', () => {
			test(
				'<container:p>' +
					'[<attribute:u view-priority="1"><attribute:b view-priority="1">foobar</attribute:b></attribute:u>]' +
				'</container:p>',
				'<attribute:b view-priority="1"></attribute:b>',
				'<container:p>[<attribute:u view-priority="1">foobar</attribute:u>]</container:p>'
			);
		} );

		it( 'should unwrap a part of a nested attribute', () => {
			test(
				'<container:p>' +
					'<attribute:u view-priority="1"><attribute:b view-priority="1">fo{ob}ar</attribute:b></attribute:u>' +
				'</container:p>',
				'<attribute:b view-priority="1"></attribute:b>',
				'<container:p>' +
					'<attribute:u view-priority="1">' +
						'<attribute:b view-priority="1">fo</attribute:b>' +
						'[ob]' +
						'<attribute:b view-priority="1">ar</attribute:b>' +
					'</attribute:u>' +
				'</container:p>'
			);
		} );

		it( 'should merge unwrapped nodes #1', () => {
			test(
				'<container:p>foo[<attribute:b view-priority="1">bar</attribute:b>]baz</container:p>',
				'<attribute:b view-priority="1"></attribute:b>',
				'<container:p>foo{bar}baz</container:p>'
			);
		} );

		it( 'should merge unwrapped nodes #2', () => {
			const input = '<container:p>' +
			'foo' +
				'<attribute:u view-priority="1">bar</attribute:u>' +
				'[' +
				'<attribute:b view-priority="1">' +
					'<attribute:u view-priority="1">bazqux</attribute:u>' +
				'</attribute:b>' +
				']' +
			'</container:p>';
			const attribute = '<attribute:b view-priority="1"></attribute:b>';
			const result = '<container:p>foo<attribute:u view-priority="1">bar{bazqux</attribute:u>]</container:p>';

			test( input, attribute, result );
		} );

		it( 'should merge unwrapped nodes #3', () => {
			const input = '<container:p>' +
				'foo' +
				'<attribute:u view-priority="1">bar</attribute:u>' +
				'[' +
				'<attribute:b view-priority="1">' +
					'<attribute:u view-priority="1">baz}qux</attribute:u>' +
				'</attribute:b>' +
			'</container:p>';
			const attribute = '<attribute:b view-priority="1"></attribute:b>';
			const result = '<container:p>' +
				'foo' +
				'<attribute:u view-priority="1">bar{baz</attribute:u>]' +
				'<attribute:b view-priority="1">' +
					'<attribute:u view-priority="1">qux</attribute:u>' +
				'</attribute:b>' +
			'</container:p>';

			test( input, attribute, result );
		} );

		it( 'should merge unwrapped nodes #4', () => {
			const input = '<container:p>' +
				'foo' +
				'<attribute:u view-priority="1">bar</attribute:u>' +
				'[' +
				'<attribute:b view-priority="1">' +
					'<attribute:u view-priority="1">baz</attribute:u>' +
				'</attribute:b>' +
				']' +
				'<attribute:u view-priority="1">qux</attribute:u>' +
			'</container:p>';
			const attribute = '<attribute:b view-priority="1"></attribute:b>';
			const result = '<container:p>' +
				'foo' +
				'<attribute:u view-priority="1">bar{baz}qux</attribute:u>' +
			'</container:p>';

			test( input, attribute, result );
		} );

		it( 'should merge unwrapped nodes #5', () => {
			const input = '<container:p>' +
				'[' +
				'<attribute:b view-priority="1"><attribute:u view-priority="1">foo</attribute:u></attribute:b>' +
				'<attribute:b view-priority="1"><attribute:u view-priority="1">bar</attribute:u></attribute:b>' +
				'<attribute:b view-priority="1"><attribute:u view-priority="1">baz</attribute:u></attribute:b>' +
				']' +
			'</container:p>';
			const attribute = '<attribute:b view-priority="1"></attribute:b>';
			const result = '<container:p>[<attribute:u view-priority="1">foobarbaz</attribute:u>]</container:p>';

			test( input, attribute, result );
		} );

		it( 'should unwrap mixed ranges #1', () => {
			const input = '<container:p>' +
				'[' +
				'<attribute:u view-priority="1">' +
					'<attribute:b view-priority="1">foo]</attribute:b>' +
				'</attribute:u>' +
			'</container:p>';
			const attribute = '<attribute:b view-priority="1"></attribute:b>';
			const result = '<container:p>[<attribute:u view-priority="1">foo</attribute:u>]</container:p>';

			test( input, attribute, result );
		} );

		it( 'should unwrap mixed ranges #2', () => {
			test(
				'<container:p>' +
					'[<attribute:u view-priority="1"><attribute:b view-priority="1">foo}</attribute:b></attribute:u>' +
				'</container:p>',
				'<attribute:b view-priority="1"></attribute:b>',
				'<container:p>[<attribute:u view-priority="1">foo</attribute:u>]</container:p>'
			);
		} );

		it( 'should unwrap single element by removing matching attributes', () => {
			test(
				'<container:p>[<attribute:b view-priority="1" foo="bar" baz="qux">test</attribute:b>]</container:p>',
				'<attribute:b view-priority="1" baz="qux"></attribute:b>',
				'<container:p>[<attribute:b view-priority="1" foo="bar">test</attribute:b>]</container:p>'
			);
		} );

		it( 'should not unwrap single element when attributes are different', () => {
			test(
				'<container:p>[<attribute:b view-priority="1" baz="qux" foo="bar">test</attribute:b>]</container:p>',
				'<attribute:b view-priority="1" baz="qux" test="true"></attribute:b>',
				'<container:p>[<attribute:b view-priority="1" baz="qux" foo="bar">test</attribute:b>]</container:p>'
			);
		} );

		it( 'should unwrap single element by removing matching classes', () => {
			test(
				'<container:p>[<attribute:b view-priority="1" class="bar baz foo">test</attribute:b>]</container:p>',
				'<attribute:b view-priority="1" class="baz foo"></attribute:b>',
				'<container:p>[<attribute:b view-priority="1" class="bar">test</attribute:b>]</container:p>'
			);
		} );

		it( 'should not unwrap single element when classes are different', () => {
			test(
				'<container:p>[<attribute:b view-priority="1" class="bar baz foo">test</attribute:b>]</container:p>',
				'<attribute:b view-priority="1" class="baz foo qux"></attribute:b>',
				'<container:p>[<attribute:b view-priority="1" class="bar baz foo">test</attribute:b>]</container:p>'
			);
		} );

		it( 'should unwrap single element by removing matching styles', () => {
			test(
				'<container:p>' +
					'[<attribute:b view-priority="1" style="color:red;position:absolute;top:10px;">test</attribute:b>]' +
				'</container:p>',
				'<attribute:b view-priority="1" style="position: absolute;"></attribute:b>',
				'<container:p>[<attribute:b view-priority="1" style="color:red;top:10px">test</attribute:b>]</container:p>'
			);
		} );

		it( 'should not unwrap single element when styles are different', () => {
			test(
				'<container:p>' +
					'[<attribute:b view-priority="1" style="color:red;position:absolute;top:10px">test</attribute:b>]' +
				'</container:p>',
				'<attribute:b view-priority="1" style="position: relative;"></attribute:b>',
				'<container:p>' +
					'[<attribute:b view-priority="1" style="color:red;position:absolute;top:10px">test</attribute:b>]' +
				'</container:p>'
			);
		} );

		it( 'should partially unwrap part of a node', () => {
			test(
				'<container:p>' +
					'[<attribute:b view-priority="1" baz="qux" foo="bar">foo}bar</attribute:b>' +
				'</container:p>',
				'<attribute:b view-priority="1" foo="bar"></attribute:b>',
				'<container:p>' +
					'[<attribute:b view-priority="1" baz="qux">foo</attribute:b>]' +
					'<attribute:b view-priority="1" baz="qux" foo="bar">bar</attribute:b>' +
				'</container:p>'
			);
		} );

		it( 'should partially unwrap a nested attribute', () => {
			test(
				'<container:p>' +
					'[<attribute:i view-priority="1">' +
						'<attribute:b view-priority="1" style="color:red;position:absolute;top:10px;">test</attribute:b>' +
					'</attribute:i>]' +
				'</container:p>',
				'<attribute:b view-priority="1" style="position: absolute;"></attribute:b>',
				'<container:p>' +
					'[<attribute:i view-priority="1">' +
						'<attribute:b view-priority="1" style="color:red;top:10px">test</attribute:b>' +
					'</attribute:i>]' +
				'</container:p>'
			);
		} );

		it( 'should partially unwrap a part of a nested attribute', () => {
			test(
				'<container:p>' +
					'<attribute:i view-priority="1">' +
						'<attribute:b view-priority="1" style="color:red;position:absolute;top:10px;">t{es}t</attribute:b>' +
					'</attribute:i>' +
				'</container:p>',
				'<attribute:b view-priority="1" style="position: absolute;"></attribute:b>',
				'<container:p>' +
					'<attribute:i view-priority="1">' +
						'<attribute:b view-priority="1" style="color:red;position:absolute;top:10px">t</attribute:b>' +
						'[<attribute:b view-priority="1" style="color:red;top:10px">es</attribute:b>]' +
						'<attribute:b view-priority="1" style="color:red;position:absolute;top:10px">t</attribute:b>' +
					'</attribute:i>' +
				'</container:p>'
			);
		} );

		it( 'should be merged after being partially unwrapped', () => {
			test(
				'<container:p>' +
					'<attribute:b view-priority="1" baz="qux">xyz</attribute:b>' +
					'[<attribute:b view-priority="1" baz="qux" foo="bar">foo}bar</attribute:b>' +
				'</container:p>',
				'<attribute:b view-priority="1" foo="bar"></attribute:b>',
				'<container:p>' +
					'<attribute:b view-priority="1" baz="qux">xyz{foo</attribute:b>]' +
					'<attribute:b view-priority="1" baz="qux" foo="bar">bar</attribute:b>' +
				'</container:p>'
			);
		} );

		it( 'should unwrap single node in document fragment', () => {
			test(
				'<container:p>[<attribute:b view-priority="1">foobar</attribute:b>]</container:p>',
				'<attribute:b view-priority="1"></attribute:b>',
				'<container:p>[foobar]</container:p>'
			);
		} );

		it( 'should unwrap EmptyElement', () => {
			test(
				'<container:p>[<attribute:b><empty:img></empty:img></attribute:b>]</container:p>',
				'<attribute:b></attribute:b>',
				'<container:p>[<empty:img></empty:img>]</container:p>'
			);
		} );

		it( 'should throw if range is inside EmptyElement', () => {
			const empty = new EmptyElement( 'img' );
			const attribute = new AttributeElement( 'b' );
			const container = new ContainerElement( 'p', null, [ empty, attribute ] );
			const range = Range._createFromParentsAndOffsets( empty, 0, container, 2 );

			expect( () => {
				writer.unwrap( range, attribute );
			} ).to.throw( CKEditorError, 'view-writer-cannot-break-empty-element' );
		} );

		it( 'should unwrap UIElement', () => {
			test(
				'<container:p>[<attribute:b><ui:span></ui:span></attribute:b>]</container:p>',
				'<attribute:b></attribute:b>',
				'<container:p>[<ui:span></ui:span>]</container:p>'
			);
		} );

		it( 'should throw if range is placed inside UIElement', () => {
			const uiElement = new UIElement( 'span' );
			const attribute = new AttributeElement( 'b' );
			const container = new ContainerElement( 'p', null, [ uiElement, attribute ] );
			const range = Range._createFromParentsAndOffsets( uiElement, 0, container, 2 );

			expect( () => {
				writer.unwrap( range, attribute );
			} ).to.throw( CKEditorError, 'view-writer-cannot-break-ui-element' );
		} );

		it( 'should unwrap if both elements have same id', () => {
			const unwrapper = writer.createAttributeElement( 'span', null, { id: 'foo' } );
			const attribute = writer.createAttributeElement( 'span', null, { id: 'foo' } );
			const container = writer.createContainerElement( 'div' );

			writer.insert( writer.createPositionAt( container, 0 ), attribute );
			writer.unwrap( Range._createOn( attribute ), unwrapper );

			expect( stringify( container, null, { showType: false, showPriority: false } ) ).to.equal( '<div></div>' );
		} );

		it( 'should always unwrap whole element if both elements have same id', () => {
			const unwrapper = writer.createAttributeElement( 'b', null, { id: 'foo' } );
			const attribute = writer.createAttributeElement( 'span', { foo: 'foo' }, { id: 'foo' } );
			const container = writer.createContainerElement( 'div' );

			writer.insert( writer.createPositionAt( container, 0 ), attribute );
			writer.unwrap( writer.createRangeOn( attribute ), unwrapper );

			expect( stringify( container, null, { showType: false, showPriority: false } ) ).to.equal( '<div></div>' );
		} );

		// Below are tests for elements with different ids.
		// Only partial unwrapping is tested because elements with different ids are never similar.
		// This means that unwrapping of whole element is not possible in this case.
		it( 'should not unwrap matching attributes if the element to unwrap has id', () => {
			const unwrapper = writer.createAttributeElement( 'span', { foo: 'foo' } );
			const attribute = writer.createAttributeElement( 'span', { foo: 'foo', bar: 'bar' }, { id: 'id' } );
			const container = writer.createContainerElement( 'div' );

			writer.insert( writer.createPositionAt( container, 0 ), attribute );
			writer.unwrap( writer.createRangeOn( attribute ), unwrapper );

			const view = stringify( container, null, { showType: false, showPriority: false } );
			expect( view ).to.equal( '<div><span bar="bar" foo="foo"></span></div>' );
		} );

		it( 'should not unwrap matching attributes if the unwrapping element has id', () => {
			const unwrapper = writer.createAttributeElement( 'span', { foo: 'foo' }, { id: 'id' } );
			const attribute = writer.createAttributeElement( 'span', { foo: 'foo', bar: 'bar' } );
			const container = writer.createContainerElement( 'div' );

			writer.insert( writer.createPositionAt( container, 0 ), attribute );
			writer.unwrap( writer.createRangeOn( attribute ), unwrapper );

			const view = stringify( container, null, { showType: false, showPriority: false } );
			expect( view ).to.equal( '<div><span bar="bar" foo="foo"></span></div>' );
		} );

		it( 'should not unwrap matching attributes if the elements have different id', () => {
			const unwrapper = writer.createAttributeElement( 'span', { foo: 'foo' }, { id: 'a' } );
			const attribute = writer.createAttributeElement( 'span', { foo: 'foo', bar: 'bar' }, { id: 'b' } );
			const container = writer.createContainerElement( 'div' );

			writer.insert( writer.createPositionAt( container, 0 ), attribute );
			writer.unwrap( writer.createRangeOn( attribute ), unwrapper );

			const view = stringify( container, null, { showType: false, showPriority: false } );
			expect( view ).to.equal( '<div><span bar="bar" foo="foo"></span></div>' );
		} );
	} );
} );
