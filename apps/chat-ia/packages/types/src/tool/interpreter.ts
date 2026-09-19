// Type duplicado de @lobechat/python-interpreter (2026-05-19): eliminamos la
// dependencia cruzada para poder borrar el package python-interpreter una vez
// api-ia exponga POST /webapi/code/execute. El shape se mantiene 1:1.
interface PythonOutput {
  data: string;
  type: 'stdout' | 'stderr';
}
interface PythonResult {
  output?: PythonOutput[];
  result?: string;
  success: boolean;
}

export interface CodeInterpreterParams {
  code: string;
  packages: string[];
}

export interface CodeInterpreterFileItem {
  data?: File;
  fileId?: string;
  filename: string;
  previewUrl?: string;
}

export interface CodeInterpreterResponse extends PythonResult {
  files?: CodeInterpreterFileItem[];
}

export interface CodeInterpreterState {
  error?: any;
}
