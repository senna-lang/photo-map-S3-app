'use server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { insertAlbum, supabaseServer } from '../lib/supabase';

export const sendForm = async (formData: any) => {
  const supabase = supabaseServer();
  const fileName = formData.get('filename');
  const imageFile = formData.getAll('file');
  const coordinate = formData.get('coordinate');
  const buffersPromises = imageFile.map(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  });

  const buffers = await Promise.all(buffersPromises);
  const { ACCESS_KEY_ID, SECRET_ACCESS_KEY_ID, REGION, S3_BUCKET_NAME } =
    process.env;
  const s3 = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID || '',
      secretAccessKey: SECRET_ACCESS_KEY_ID || '',
    },
  });
  // アップロードパラメータの設定

  try {
    const imageUrlArrPromise = buffers.map(async (buffer, index) => {
      const uploadParams: any = {
        Bucket: S3_BUCKET_NAME,
        Key: `${fileName}(${index})`, //保存時の画像名
        Body: buffer, //input fileから取得
        ContentType: 'image/png', // 適切なContentTypeを設定
        ACL: 'public-read', // 公開読み取りアクセスを設定
      };
      const command = new PutObjectCommand(uploadParams);
      await s3.send(command);
      const imageUrl = `https://${S3_BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileName}(${index})`;
      return imageUrl;
    });
    const imageUrlArr = await Promise.all(imageUrlArrPromise);
    await insertAlbum(supabase, coordinate, imageUrlArr);
  } catch (err) {
    return console.error(err);
  }
};
