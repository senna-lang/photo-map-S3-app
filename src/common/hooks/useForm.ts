import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema } from '../lib/formSchema';
import { useCallback } from 'react';
import { z } from 'zod';
import { sendForm } from '../actions/server';

export const useImageForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      filename: '',
      file: undefined,
      coordinate: '',
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = useCallback(
    async values => {
      const { filename, file, coordinate } = values;
      const fileArray = Array.from(file);
      const formData = new FormData();
      formData.append('filename', filename);
      formData.append('coordinate', coordinate);
      fileArray.map(file => {
        formData.append('file', file);
      });
      const imageFile = formData.getAll('file');
      // console.log(imageFile);
      const res = await sendForm(formData);
      return res;
    },
    []
  );

  return { form, onSubmit };
};
