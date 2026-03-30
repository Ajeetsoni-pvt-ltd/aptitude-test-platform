// frontend/src/pages/admin/UploadQuestionsPage.tsx
import { useState, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import apiClient from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const UploadQuestionsPage = () => {
  const [file, setFile]           = useState<File | null>(null);
  const [isUploading, setUploading] = useState(false);
  const [result, setResult]       = useState<any>(null);
  const [error, setError]         = useState('');
  const fileInputRef              = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.docx')) {
        setError('Sirf .docx files allowed hain!');
        return;
      }
      setFile(selected);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) { setError('Pehle file select karo!'); return; }
    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/upload/questions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data.data);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload fail ho gaya. Dobara try karo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📤 Upload Questions</h1>
          <p className="text-gray-500">.docx file upload karo → Automatically parse hogi → DB mein save hogi</p>
        </div>

        {/* Upload Card */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Word File Upload</CardTitle>
            <CardDescription>Sirf .docx format (max 5MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
                ${file
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                }`}
            >
              <div className="text-5xl mb-3">{file ? '✅' : '📄'}</div>
              {file ? (
                <div>
                  <p className="font-semibold text-green-700">{file.name}</p>
                  <p className="text-green-500 text-sm mt-1">
                    {(file.size / 1024).toFixed(1)} KB — Ready to upload!
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-700">Click karke .docx file choose karo</p>
                  <p className="text-gray-400 text-sm mt-1">ya yahan drag & drop karo</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">⚠️ {error}</p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-11"
            >
              {isUploading
                ? <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Upload ho raha hai...</span>
                : '🚀 Upload & Parse Karo'}
            </Button>
          </CardContent>
        </Card>

        {/* Result Card */}
        {result && (
          <Card className="border-0 shadow-md border-l-4 border-green-500">
            <CardContent className="p-6">
              <h3 className="font-bold text-green-700 text-lg mb-3">✅ Upload Successful!</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-green-600">{result.savedCount}</p>
                  <p className="text-sm text-gray-500">Questions Saved</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-blue-600">{result.totalParsed}</p>
                  <p className="text-sm text-gray-500">Total Parsed</p>
                </div>
              </div>
              {Array.isArray(result.parseErrors) && result.parseErrors.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-3 mt-3">
                  <p className="font-semibold text-amber-700 mb-2">⚠️ Parse Errors:</p>
                  {result.parseErrors.map((e: string, i: number) => (
                    <p key={i} className="text-amber-600 text-sm">• {e}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Word File Format Guide */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">📋 Word File Format Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-900 text-green-400 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">
{`TOPIC: Quantitative Aptitude
SUBTOPIC: Percentage
DIFFICULTY: easy

Q1. Question text yahan likhein?
A) Option 1
B) Option 2
C) Option 3
D) Option 4
ANSWER: B
EXPLANATION: Explanation yahan

Q2. Agla question...`}
            </pre>
            <div className="mt-3 space-y-1">
              {[
                'Exactly 4 options hone chahiye (A, B, C, D)',
                'ANSWER mein sirf letter likhein (A/B/C/D)',
                'File .docx format mein honi chahiye',
                'Max file size: 5MB',
              ].map((rule) => (
                <p key={rule} className="text-xs text-gray-500">✅ {rule}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default UploadQuestionsPage;