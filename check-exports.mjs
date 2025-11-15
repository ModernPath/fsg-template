import * as gamma from './lib/gamma-generator.ts';
console.log('Exports:', Object.keys(gamma));
console.log('Has createGammaPresentation:', 'createGammaPresentation' in gamma);
console.log('Type:', typeof gamma.createGammaPresentation);
