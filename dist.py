#!/usr/bin/env python

# The purpose of this script is to merge the .css and (generated) .js code into the .html for easier distribution.  Having them all in one file ensures that you always get matching versions, whereas with separate files you would have to take measures to avoid the browser's cache giving you non-matching ones.

import os, sys

path = os.path.dirname(os.path.abspath(sys.argv[0])) + "/"

try:
    os.mkdir(path + "dist")
except OSError:
    pass

external_css = '<link rel="stylesheet" href="blockfall.css">'
external_js = '<script src="symlink_to_tsc_output.js"></script>'
inline_css = "<style>\n" + open(path + "src/blockfall.css").read() + "</style>\n"
inline_js = "<script>\n" + open(path + "tsc_output.js").read() + "</script>\n"

in_html = open(path + "src/blockfall.html").read()
out_html = in_html.replace(external_css, inline_css).replace(external_js, inline_js)
out_html_f = open(path + "dist/blockfall.html", "w")
out_html_f.write(out_html)
