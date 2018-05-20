Remove Redirect
===============
Some web pages use intermediary pages before redirecting to a final page. This WebExtension tries to extract the final URL from the intermediary URL and replace it before you use it.  
As an example, try this URL:
 www.google.com/chrome/?or-maybe-rather-firefox=http%3A%2F%2Fwww.mozilla.org/

Please give feedback (see below) if you find websites where this fails (except on here, no extensions work on AMO) or where you get redirected in a weird way when this add-on is enabled but not when it's disabled.

See the add-on's preferences (also available by clicking the toolbar icon) for options. By default all URLs but the ones matching a blacklist are checked for embedded URLs and redirects are removed. Depending on the pages visited, this can cause problems, for example a dysfunctional login. The blacklist can be edited to avoid these problems. There is also a whitelist mode to avoid this kind of problem altogether. In whitelist mode, all URLs for which redirects should be removed need to be configured by hand.

Credits
-------
The original [Skip Redirect](https://github.com/sblask/webextension-skip-redirect) extension, including all the URL extraction logic itself, was created by Sebastian Blask. This extension only exists because of him.
If you want to skip redirects by intercepting requests instead of replacing URLs on the page, check out the original.

A list of details in which Remove Redirect differs from Skip Redirect:
* The final URL will be shown in the status bar and can be normally copied to the clipboard, instead of the useless redirection URL.
* Preload optimizations work, potentially enabling faster page loads.
* It only works for following links normally, and not for navigation that is initiated in other ways (usually with Javascript).
* There are no notifications or context menu functionality.
* For changed settings to apply, the page must be reloaded.
* The whitelist uses regular expressions instead of [WebExtension match patterns](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Match_patterns).
* The same-domain redirect removal setting looks at each redirect for nested redirects, instead of only at initial and final URL.

Known Limitations
-----------------
 * This extension (or Skip Redirect for that matter) is not sufficient for preventing tracking via ping attributes or Javascript (as for example Google uses it).
 * If the webpage is loaded via a mechanism different from following normal links (for example, changing the current tab's location with JavaScript), redirections will still take place.
 * If the final destination of a link is changed after moving the mouse over it, the URL in the status bar will not update to reflect that. This is a limitation of Firefox.
 * For changed settings to apply, the page must be reloaded. This is a side effect of permanently changing the href attributes (needed for showing final destinations in the status bar).
 * Shortened links are currently not replaced, as they do not contain the destination in their URL.
 * There is no global blacklist for pages that don't work without redirects yet, you will have to add those exceptions yourself.

Privacy
-------
This extension does not collect or send data of any kind to third parties.
 
Feedback
--------
You can report bugs or make feature requests on
[Github](https://github.com/hyperfekt/webextension-remove-redirect)

Patches are welcome.
