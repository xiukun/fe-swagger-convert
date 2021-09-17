/*
 * @Description: OSS系统API生成文件
 * @Autor: henry.xiukun
 * @Date: 2021-09-16 17:53:19
 * @LastEditors: henry.xiukun
 */
const fs = require('fs');
const path = require('path');
const parse = require('swagger-parser');
const swaggerUrl = 'https://api.t.dev.pay.fun/tag/swagger/doc.json';
// api接口方法存放目录
const API_PATH = path.resolve(__dirname, './src/ossApi');

// 判断目录是否存在
const isExist = async (lastPath = '') => {
	const privatePath = `${lastPath ? API_PATH + '/' + lastPath : API_PATH}`;
	const stat = fs.existsSync(privatePath);
	if (!stat) {
		await fs.mkdirSync(privatePath);
	}
	// if (!lastPath) {
	// 	const configPath = `${API_PATH}/config.js`;
	// 	// api 目录下写入 config文件
	// 	fs.access(configPath, function (err) {
	// 		if (err && err.code === 'ENOENT') {
	// 			fs.writeFileSync(
	// 				`${API_PATH}/config.js`,
	// 				"export const ip = 'https://test.××××.com/'"
	// 			);
	// 		}
	// 	});
	// }
};

// 整理出相同模块路径
const getModules = (map) => {
	map.forEach((value, key) => {
		writeFileApi(key, value);
	});
};

// 写入js
const writeFileApi = (fileName, apiData) => {
	// api.js
	let tplApi = 'export default {\n';
	// index.js
	let tplIndex =
		"import axios from '@/libs/api.request_common'\n" +
		"import api from './api'\n";

	const apiDataLen = apiData.length;
	for (let i = 0; i < apiDataLen; i++) {
		const item = apiData[i];

		const itemKeys = Object.keys(item).filter((i) => i != 'allPath'); // 请求方法
		for (const key in itemKeys) {
			const itemTagKey = itemKeys[key]; // 方法数据信息 get/post等
			const itemKeysFirst = item[itemTagKey];

			const allPath = item.allPath;

			// const num = allPath.lastIndexOf('/');
			// const fnName = allPath.substring(num + 1); //获取方法路径最后的/后面的值
			// const pathName = itemTagKey + '_' + fnName;

			let arrPath = allPath.substring(1).split('/');
			const pathName = itemTagKey + '_' + arrPath.join('_'); // 根据路径生成方法名

			// 生成api.js
			tplApi = `${tplApi}   ${pathName}: \`${allPath.substring(
				allPath.indexOf('/') + 1
			)}\`, //  ${itemKeysFirst.summary}`;

			// 生成参数注释
			let description = `/** \n * ${itemKeysFirst.summary}\n`;
			itemKeysFirst.parameters.forEach((item) => {
				description += ` * @param ${item.name} - ${item.description} \n`;
			});
			description += ` */\n`;

			tplIndex =
				`${tplIndex}\n${description}\n` +
				`export const ${pathName} = (params) => {\n` +
				`    return axios.request({
        url: api.${pathName},
        method: '${itemTagKey}',
        params,
    })\n}`;
		}
	}
	tplApi = tplApi + '\n}';
	fs.writeFileSync(`${API_PATH}/${fileName}/api.js`, tplApi);
	fs.writeFileSync(`${API_PATH}/${fileName}/index.js`, tplIndex);
};

// 入口方法
const apigen = async () => {
	await isExist();
	try {
		const parsed = await parse.parse(swaggerUrl);
		const paths = parsed.paths;
		const pathsKeys = Object.keys(paths); // 获取url路径
		const pathsKeysLen = pathsKeys.length;
		const modulesMap = new Map();
		for (let i = 0; i < pathsKeysLen; i++) {
			const item = pathsKeys[i];
			const itemAry = item.split('/');
			const pathsItem = paths[item];
			let fileName = itemAry[3];
			if (!fileName) continue;
			fileName = fileName.toLowerCase();
			// 创建模块目录
			isExist(fileName);
			// 完整路径
			pathsItem.allPath = item;
			if (modulesMap.has(fileName)) {
				const fileNameAry = modulesMap.get(fileName);
				fileNameAry.push(pathsItem);
				modulesMap.set(fileName, fileNameAry);
			} else {
				modulesMap.set(fileName, [pathsItem]);
			}
		}
		getModules(modulesMap);
	} catch (e) {
		console.log(e);
	}
};

apigen();
