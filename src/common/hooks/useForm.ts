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
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = useCallback(
    async values => {
      const { filename, file } = values;
      const formData = new FormData();
      formData.append('filename', filename);
      formData.append('file', file[0]);
      const res =await sendForm(formData);
      return res;
    },
    []
  );

  return { form, onSubmit };
};
