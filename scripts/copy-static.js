const fs = require('fs');
const path = require('path');

const srcHtml = path.join(__dirname, '..', 'src', 'index.html');
const distHtml = path.join(__dirname, '..', 'dist', 'index.html');
const srcCss = path.join(__dirname, '..', 'src', 'styles', 'index.css');
const distCss = path.join(__dirname, '..', 'dist', 'styles', 'index.css');
const srcAssets = path.join(__dirname, '..', 'src', 'assets');
const distAssets = path.join(__dirname, '..', 'dist', 'assets');

fs.mkdirSync(path.dirname(distHtml), { recursive: true });
fs.copyFileSync(srcHtml, distHtml);
fs.mkdirSync(path.dirname(distCss), { recursive: true });
fs.copyFileSync(srcCss, distCss);

if (fs.existsSync(srcAssets)) {
	fs.mkdirSync(distAssets, { recursive: true });
	fs.readdirSync(srcAssets).forEach((file) => {
		const srcFile = path.join(srcAssets, file);
		const distFile = path.join(distAssets, file);
		if (fs.statSync(srcFile).isFile()) {
			fs.copyFileSync(srcFile, distFile);
		}
	});
}
