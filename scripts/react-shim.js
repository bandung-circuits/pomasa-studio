// esbuild --inject shim: client modules reference React / ReactDOM / h as free
// globals; esbuild rewrites each reference to an import from this module.
// react / react-dom stay external and resolve through the dsh module loader.
import React from 'react'
import ReactDOM from 'react-dom'

const h = React.createElement

export { React, ReactDOM, h }
