import { http, unwrap } from './http';
import type { UploadResult } from './types';

export type UploadScene = 'avatar' | 'note_cover' | 'note_content';

export const uploadFile = (file: File, scene: UploadScene) => {
  const form = new FormData();
  form.append('file', file);
  form.append('scene', scene);
  return unwrap<UploadResult>(
    http.post('/files/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  );
};
