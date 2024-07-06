/**
 * 图片转换base64工具
 * 给他一个文件对象，他会返回一个base64字符串
 */
export const convertBase64 = (event) => {
  console.log("调用base64格式转换工具");
  const fileData = event.target.files[0];
  console.log('Selected file:', fileData);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      // 获取完整的 base64 编码
      const fullBase64 = event.target.result;

      // 去掉头部信息，只保留编码部分
      const base64WithoutHeader = fullBase64.split(';base64,').pop();

      // 返回 base64 编码字符串
      console.log(base64WithoutHeader);
      resolve(base64WithoutHeader);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(fileData);
  });
};
