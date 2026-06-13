import { ChangeEvent, useRef } from "react";
import { ImagePlus, Upload } from "lucide-react";

type UploadPanelProps = {
  disabled: boolean;
  onUpload: (files: FileList) => void;
};

export function UploadPanel({ disabled, onUpload }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0) {
      onUpload(files);
      event.target.value = "";
    }
  }

  return (
    <div className="upload-panel">
      <div className="panel-heading">
        <h2>Photos</h2>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          title="Choose photos"
        >
          <ImagePlus size={16} aria-hidden="true" />
          <span>Select</span>
        </button>
      </div>
      <label className={`drop-zone ${disabled ? "disabled" : ""}`}>
        <Upload size={24} aria-hidden="true" />
        <span>Upload images</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={disabled}
          onChange={handleChange}
        />
      </label>
    </div>
  );
}
