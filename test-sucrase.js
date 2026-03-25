const { transform } = require('sucrase');
console.log(transform('import React from "react";', { transforms: ['typescript', 'jsx', 'imports'] }).code);
