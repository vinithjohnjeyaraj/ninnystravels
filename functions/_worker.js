// functions/_worker.js
export async function onRequest({ request, env }) {
  // Define your Firebase configuration using environment variables
  // IMPORTANT: These environment variables must be set in your Cloudflare Pages project settings.
  // Using '|| null' or '|| ""' to ensure variables are never 'undefined' in the injected script,
  // which can cause JavaScript syntax errors.
  const firebaseConfig = {
    apiKey: env.FIREBASE_API_KEY || null,
    authDomain: env.FIREBASE_AUTH_DOMAIN || null,
    projectId: env.FIREBASE_PROJECT_ID || null,
    storageBucket: env.FIREBASE_STORAGE_BUCKET || null,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || null,
    appId: env.FIREBASE_APP_ID || null,
    measurementId: env.FIREBASE_MEASUREMENT_ID || null
  };

  // Define your Google Maps API key using an environment variable
  const googleMapsApiKey = env.GOOGLE_MAPS_API_KEY || ''; // Use empty string for safety

  try {
    // Fetch the original index.html
    const response = await env.ASSETS.fetch(request);
    let html = await response.text();

    // Inject Firebase config and Google Maps API key into the HTML
    // This script will be executed before your main app script
    const injectionScript = `
      <script>
        window.FIREBASE_CONFIG = ${JSON.stringify(firebaseConfig)};
        window.GOOGLE_MAPS_API_KEY = "${googleMapsApiKey}";

        // Dynamically load Google Maps script
        // Only attempt to load if a valid API key is present
        if (window.GOOGLE_MAPS_API_KEY && window.GOOGLE_MAPS_API_KEY !== "" && !document.querySelector('script[src*="maps.googleapis.com"]')) {
            const script = document.createElement('script');
            script.src = \`https://maps.googleapis.com/maps/api/js?key=\${window.GOOGLE_MAPS_API_KEY}&callback=initMap&libraries=marker\`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }
      </script>
    `;

    // Insert the injection script right after the <head> tag for early availability
    html = html.replace('<head>', '<head>' + injectionScript);

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    // Catch any errors during the fetch or HTML manipulation
    console.error("Error in Cloudflare Pages Function:", error);
    // Return a more informative error to help debugging, including the error stack
    return new Response(`Error 1019: Compute server error in Pages Function.
    Details: ${error.message}.
    Stack: ${error.stack || 'No stack trace available.'}
    Please ensure all environment variables are correctly set in Cloudflare Pages settings.`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}