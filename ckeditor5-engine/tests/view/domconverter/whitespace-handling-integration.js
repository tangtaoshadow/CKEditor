/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import VirtualTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/virtualtesteditor';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import ShiftEnter from '@ckeditor/ckeditor5-enter/src/shiftenter';

import { getData } from '../../../src/dev-utils/model';

// NOTE:
// dev utils' setData() loses white spaces so don't use it for tests here!!!
// https://github.com/ckeditor/ckeditor5-engine/issues/1428

describe( 'DomConverter – whitespace handling – integration', () => {
	let editor;

	// See https://github.com/ckeditor/ckeditor5-engine/issues/822.
	describe( 'normalizing whitespaces around block boundaries (#822)', () => {
		beforeEach( () => {
			return VirtualTestEditor
				.create( { plugins: [ Paragraph ] } )
				.then( newEditor => {
					editor = newEditor;
				} );
		} );

		afterEach( () => {
			return editor.destroy();
		} );

		it( 'new line at the end of the content is ignored', () => {
			editor.setData( '<p>foo</p>\n' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo</p>' );
		} );

		it( 'whitespaces at the end of the content are ignored', () => {
			editor.setData( '<p>foo</p>\n\r\n \t' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo</p>' );
		} );

		// Controversial result. See https://github.com/ckeditor/ckeditor5-engine/issues/987.
		it( 'nbsp at the end of the content is not ignored', () => {
			editor.setData( '<p>foo</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo</p>' );
		} );

		it( 'new line at the beginning of the content is ignored', () => {
			editor.setData( '\n<p>foo</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo</p>' );
		} );

		it( 'whitespaces at the beginning of the content are ignored', () => {
			editor.setData( '\n\n \t<p>foo</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo</p>' );
		} );

		// Controversial result. See https://github.com/ckeditor/ckeditor5-engine/issues/987.
		it( 'nbsp at the beginning of the content is not ignored', () => {
			editor.setData( '<p>foo</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo</p>' );
		} );

		it( 'new line between blocks is ignored', () => {
			editor.setData( '<p>foo</p>\n<p>bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo</paragraph><paragraph>bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo</p><p>bar</p>' );
		} );

		it( 'whitespaces between blocks are ignored', () => {
			editor.setData( '<p>foo</p>\n\n \t<p>bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo</paragraph><paragraph>bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo</p><p>bar</p>' );
		} );

		// Controversial result. See https://github.com/ckeditor/ckeditor5-engine/issues/987.
		it( 'nbsp between blocks is not ignored', () => {
			editor.setData( '<p>foo</p>&nbsp;<p>bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo</paragraph><paragraph>bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo</p><p>bar</p>' );
		} );

		it( 'new lines inside blocks are ignored', () => {
			editor.setData( '<p>\nfoo\n</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo</p>' );
		} );

		it( 'whitespaces inside blocks are ignored', () => {
			editor.setData( '<p>\n\n \tfoo\n\n \t</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo</p>' );
		} );

		it( 'nbsp inside blocks are not ignored', () => {
			editor.setData( '<p>&nbsp;foo&nbsp;</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph> foo </paragraph>' );

			expect( editor.getData() ).to.equal( '<p>&nbsp;foo&nbsp;</p>' );
		} );

		it( 'all whitespaces together are ignored', () => {
			editor.setData( '\n<p>foo\n\r\n \t</p>\n<p> bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo</paragraph><paragraph>bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo</p><p>bar</p>' );
		} );
	} );

	// https://github.com/ckeditor/ckeditor5/issues/1024
	describe( 'whitespaces around <br>s', () => {
		beforeEach( () => {
			return VirtualTestEditor
				.create( { plugins: [ Paragraph, ShiftEnter ] } )
				.then( newEditor => {
					editor = newEditor;
				} );
		} );

		afterEach( () => {
			return editor.destroy();
		} );

		it( 'single spaces around <br>', () => {
			editor.setData( '<p>foo&nbsp;<br>&nbsp;bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo <softBreak></softBreak> bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo&nbsp;<br>&nbsp;bar</p>' );
		} );

		it( 'single spaces around <br> (normalization)', () => {
			editor.setData( '<p>foo&nbsp;<br> bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo <softBreak></softBreak>bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo&nbsp;<br>bar</p>' );
		} );

		it( 'two spaces before a <br>', () => {
			editor.setData( '<p>foo &nbsp;<br>bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo  <softBreak></softBreak>bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo &nbsp;<br>bar</p>' );
		} );

		it( 'two spaces before a <br> (normalization)', () => {
			editor.setData( '<p>foo&nbsp; <br>bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo  <softBreak></softBreak>bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo &nbsp;<br>bar</p>' );
		} );

		it( 'two spaces before a <br> (normalization to a model nbsp)', () => {
			editor.setData( '<p>foo&nbsp;&nbsp;<br>bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo\u00a0 <softBreak></softBreak>bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo&nbsp;&nbsp;<br>bar</p>' );
		} );

		it( 'single space after a <br>', () => {
			editor.setData( '<p>foo<br>&nbsp;bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo<softBreak></softBreak> bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo<br>&nbsp;bar</p>' );
		} );

		it( 'single space after a <br> (normalization)', () => {
			editor.setData( '<p>foo<br> bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo<softBreak></softBreak>bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo<br>bar</p>' );
		} );

		it( 'two spaces after a <br>', () => {
			editor.setData( '<p>foo<br>&nbsp; bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo<softBreak></softBreak>  bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo<br>&nbsp; bar</p>' );
		} );

		it( 'two spaces after a <br> (normalization)', () => {
			editor.setData( '<p>foo<br> &nbsp;bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo<softBreak></softBreak> bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo<br>&nbsp;bar</p>' );
		} );

		it( 'two spaces after a <br> (normalization to a model nbsp)', () => {
			editor.setData( '<p>foo<br>&nbsp;&nbsp;bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo<softBreak></softBreak> \u00a0bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo<br>&nbsp;&nbsp;bar</p>' );
		} );

		// https://github.com/ckeditor/ckeditor5-engine/issues/1429
		// it( 'space between <br>s', () => {
		// 	editor.setData( '<p>foo<br>&nbsp;<br>bar</p>' );

		// 	expect( getData( editor.model, { withoutSelection: true } ) )
		// 		.to.equal( '<paragraph>foo<softBreak></softBreak> <softBreak></softBreak>bar</paragraph>' );

		// 	expect( editor.getData() ).to.equal( '<p>foo<br>&nbsp;<br>bar</p>' );
		// } );

		it( 'space between <br>s (normalization)', () => {
			editor.setData( '<p>foo<br> <br>bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo<softBreak></softBreak><softBreak></softBreak>bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo<br><br>bar</p>' );
		} );

		it( 'two spaces between <br>s', () => {
			editor.setData( '<p>foo<br>&nbsp;&nbsp;<br>bar</p>' );

			expect( getData( editor.model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foo<softBreak></softBreak>  <softBreak></softBreak>bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo<br>&nbsp;&nbsp;<br>bar</p>' );
		} );
	} );
} );
