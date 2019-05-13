#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* eslint-env node */

'use strict';

// In order to use the same version for all packages (including builds and ckeditor5 itself), you can call:
// yarn run changelog [newVersion]

const devEnv = require( '@ckeditor/ckeditor5-dev-env' );
const commonOptions = {
	cwd: process.cwd(),
	packages: 'packages',
	// `newVersion` is mostly used for testing purposes. It allows generating changelog that contains the same version for all packages.
	newVersion: process.argv[ 2 ] || null
};
const editorBuildsGlob = '@ckeditor/ckeditor5-build-*';

const optionsForDependencies = Object.assign( {}, commonOptions, {
	skipPackages: editorBuildsGlob,
	skipMainRepository: true
} );

const optionsForBuilds = Object.assign( {}, commonOptions, {
	scope: editorBuildsGlob
} );

Promise.resolve()
	.then( () => devEnv.generateChangelogForSubRepositories( optionsForDependencies ) )
	.then( () => devEnv.generateSummaryChangelog( optionsForBuilds ) )
	.then( () => {
		console.log( 'Done!' );
	} )
	.catch( err => {
		console.error( err.stack );
	} );
