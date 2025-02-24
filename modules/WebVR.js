/**
 * @author mrdoob / http://mrdoob.com
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Based on @tojiro's vr-samples-utils.js
 */



var WEBVR = {

	createButton: function ( renderer, options ) {

		if ( options && options.referenceSpaceType ) {

			renderer.vr.setReferenceSpaceType( options.referenceSpaceType );
		}

		function showEnterVR( device ) {

			button.style.display = '';

			button.style.cursor = 'pointer';
			button.style.left = 'calc(50% - 50px)';
			button.style.width = '100px';

			button.textContent = 'ENTER VR';

			button.onmouseenter = function () {

				button.style.opacity = '1.0';

			};

			button.onmouseleave = function () {

				button.style.opacity = '0.5';

			};

			button.onclick = function () {

				device.isPresenting ? device.exitPresent() : device.requestPresent( [ { source: renderer.domElement } ] );

			};

			renderer.vr.setDevice( device );

		}

		function getXRSessionInit( mode, options) {
			var space = (options || {}).referenceSpaceType || 'local-floor';
			var sessionInit = options.sessionInit || {};

			// Nothing to do for default features.
			if ( space == 'viewer' )
				return sessionInit;
			if ( space == 'local' && mode.startsWith('immersive' ) )
				return sessionInit;

			// If the user already specified the space as an optional or required feature, don't do anything.
			if ( sessionInit.optionalFeatures && sessionInit.optionalFeatures.includes(space) )
				return sessionInit;
			if ( sessionInit.requiredFeatures && sessionInit.requiredFeatures.includes(space) )
				return sessionInit;

			// The user didn't request the reference space type as a feature. Add it to a shallow copy
			// of the user-supplied sessionInit requiredFeatures (if any) to ensure it's valid to
			// request it later.
			var newInit = Object.assign( {}, sessionInit );
			newInit.requiredFeatures = [ space ];
			if ( sessionInit.requiredFeatures ) {
				newInit.requiredFeatures = newInit.requiredFeatures.concat( sessionInit.requiredFeatures );
			}
			return newSessionInit;
		}

		function showEnterXR() {
			let name = options.mode == 'immersive-vr' ? 'VR' : 'AR';
			var currentSession = null;

			function onSessionStarted( session ) {

				session.addEventListener( 'end', onSessionEnded );

				renderer.vr.setSession( session );
				button.textContent = 'EXIT ' + name;

				currentSession = session;

			}

			function onSessionEnded( /*event*/ ) {

				currentSession.removeEventListener( 'end', onSessionEnded );

				renderer.vr.setSession( null );
				button.textContent = 'ENTER ' + name;

				currentSession = null;

			}

			//

			button.style.display = '';

			button.style.cursor = 'pointer';
			//button.style.left = 'calc(50% - 50px)';
			button.style.width = '100px';

			button.textContent = 'ENTER ' + name;

			button.onmouseenter = function () {

				button.style.opacity = '1.0';

			};

			button.onmouseleave = function () {

				button.style.opacity = '0.5';

			};

			button.onclick = function () {

				if ( currentSession === null ) {

					var mode = options.mode || 'immersive-vr';
					var sessionInit = getXRSessionInit( mode, options );
					navigator.xr.requestSession( mode, sessionInit ).then( onSessionStarted );

				} else {

					currentSession.end();

				}

			};

		}

		function disableButton() {

			button.style.display = '';

			button.style.cursor = 'auto';
			button.style.left = 'calc(50% - 75px)';
			button.style.width = '150px';

			button.onmouseenter = null;
			button.onmouseleave = null;

			button.onclick = null;

		}

		function showVRNotFound() {

			disableButton();

			button.textContent = 'VR NOT FOUND';

			renderer.vr.setDevice( null );

		}

		function showXRNotFound() {

			disableButton();

			button.textContent = 'XR NOT FOUND';

		}

		function stylizeElement( element ) {

			element.style.position = 'absolute';
			element.style.bottom = '20px';
			element.style.padding = '12px 6px';
			element.style.border = '1px solid #fff';
			element.style.borderRadius = '4px';
			element.style.background = 'rgba(0,0,0,0.1)';
			element.style.color = '#fff';
			element.style.font = 'normal 13px sans-serif';
			element.style.textAlign = 'center';
			element.style.opacity = '0.5';
			element.style.outline = 'none';
			element.style.zIndex = '999';

		}

		if ( 'xr' in navigator && 'supportsSession' in navigator.xr ) {

			var button = document.createElement( 'button' );
			button.style.display = 'none';

			stylizeElement( button );

			var mode = options.mode || 'immersive-vr';
			navigator.xr.supportsSession( mode ).then( showEnterXR ).catch( showXRNotFound );

			return button;

		} else if ( 'getVRDisplays' in navigator ) {

			var button = document.createElement( 'button' );
			button.style.display = 'none';

			stylizeElement( button );

			window.addEventListener( 'vrdisplayconnect', function ( event ) {

				showEnterVR( event.display );

			}, false );

			window.addEventListener( 'vrdisplaydisconnect', function ( /*event*/ ) {

				showVRNotFound();

			}, false );

			window.addEventListener( 'vrdisplaypresentchange', function ( event ) {

				button.textContent = event.display.isPresenting ? 'EXIT VR' : 'ENTER VR';

			}, false );

			window.addEventListener( 'vrdisplayactivate', function ( event ) {

				event.display.requestPresent( [ { source: renderer.domElement } ] );

			}, false );

			navigator.getVRDisplays()
				.then( function ( displays ) {

					if ( displays.length > 0 ) {

						showEnterVR( displays[ 0 ] );

					} else {

						showVRNotFound();

					}

				} ).catch( showVRNotFound );

			return button;

		} else {

			var message = document.createElement( 'a' );
			message.href = 'https://webvr.info';
			message.innerHTML = 'WEBVR NOT SUPPORTED';

			message.style.left = 'calc(50% - 90px)';
			message.style.width = '180px';
			message.style.textDecoration = 'none';

			stylizeElement( message );

			return message;

		}

	}

};

export { WEBVR };
