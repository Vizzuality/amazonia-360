import { describe, it, expect } from "vitest";
import { sanitizeFilename } from "../../src/utils/sanitize-filenames";

describe("sanitizeFilename", () => {
  describe("should preserve valid characters", () => {
    it("should preserve alphanumeric characters", () => {
      const input = "abc123XYZ";
      const result = sanitizeFilename(input);
      expect(result).toBe("abc123XYZ");
    });

    it("should preserve periods", () => {
      const input = "file.name.txt";
      const result = sanitizeFilename(input);
      expect(result).toBe("file.name.txt");
    });

    it("should preserve hyphens", () => {
      const input = "my-file-name";
      const result = sanitizeFilename(input);
      expect(result).toBe("my-file-name");
    });

    it("should preserve underscores", () => {
      const input = "my_file_name";
      const result = sanitizeFilename(input);
      expect(result).toBe("my_file_name");
    });

    it("should preserve combination of valid characters", () => {
      const input = "My_File-123.txt";
      const result = sanitizeFilename(input);
      expect(result).toBe("My_File-123.txt");
    });
  });

  describe("should remove invalid characters", () => {
    it("should remove spaces", () => {
      const input = "my file name";
      const result = sanitizeFilename(input);
      expect(result).toBe("myfilename");
    });

    it("should remove common problematic filename characters", () => {
      const input = 'file/\\:*?"<>|name';
      const result = sanitizeFilename(input);
      expect(result).toBe("filename");
    });

    it("should remove special symbols", () => {
      const input = "file@#$%^&()+={}[]name";
      const result = sanitizeFilename(input);
      expect(result).toBe("filename");
    });

    it("should remove unicode characters", () => {
      const input = "file名前🎉.txt";
      const result = sanitizeFilename(input);
      expect(result).toBe("file.txt");
    });

    it("should remove punctuation marks", () => {
      const input = "file,;:!?name.txt";
      const result = sanitizeFilename(input);
      expect(result).toBe("filename.txt");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const input = "";
      const result = sanitizeFilename(input);
      expect(result).toBe("");
    });

    it("should handle string with only invalid characters", () => {
      const input = "@#$%^&*()";
      const result = sanitizeFilename(input);
      expect(result).toBe("");
    });

    it("should handle string with only spaces", () => {
      const input = "   ";
      const result = sanitizeFilename(input);
      expect(result).toBe("");
    });

    it("should handle very long filename", () => {
      const input = "a".repeat(1000) + "@#$" + "b".repeat(500);
      const result = sanitizeFilename(input);
      expect(result).toBe("a".repeat(1000) + "b".repeat(500));
    });
  });

  describe("mixed valid and invalid characters", () => {
    it("should preserve valid characters and remove invalid ones from mixed string", () => {
      const input = "My File (2023).txt";
      const result = sanitizeFilename(input);
      expect(result).toBe("MyFile2023.txt");
    });

    it("should handle filename with path separators", () => {
      const input = "folder/subfolder\\file.txt";
      const result = sanitizeFilename(input);
      expect(result).toBe("foldersubfolderfile.txt");
    });

    it("should handle filename with timestamp", () => {
      const input = "report_2023-12-01_14:30:25.pdf";
      const result = sanitizeFilename(input);
      expect(result).toBe("report_2023-12-01_143025.pdf");
    });

    it("should handle filename with multiple extensions", () => {
      const input = "archive.tar.gz";
      const result = sanitizeFilename(input);
      expect(result).toBe("archive.tar.gz");
    });
  });

  describe("boundary conditions", () => {
    it("should handle string starting with invalid characters", () => {
      const input = "@#$filename.txt";
      const result = sanitizeFilename(input);
      expect(result).toBe("filename.txt");
    });

    it("should handle string ending with invalid characters", () => {
      const input = "filename.txt@#$";
      const result = sanitizeFilename(input);
      expect(result).toBe("filename.txt");
    });

    it("should handle string with invalid characters in the middle", () => {
      const input = "file@#$name.txt";
      const result = sanitizeFilename(input);
      expect(result).toBe("filename.txt");
    });

    it("should handle consecutive invalid characters", () => {
      const input = "file@@@###$$$name.txt";
      const result = sanitizeFilename(input);
      expect(result).toBe("filename.txt");
    });
  });

  describe("real-world scenarios", () => {
    it("should sanitize typical user uploaded filename", () => {
      const input = "My Document (Final Version).docx";
      const result = sanitizeFilename(input);
      expect(result).toBe("MyDocumentFinalVersion.docx");
    });

    it("should sanitize filename with email-like pattern", () => {
      const input = "report@company.com.pdf";
      const result = sanitizeFilename(input);
      expect(result).toBe("reportcompany.com.pdf");
    });

    it("should sanitize filename with URL-like pattern", () => {
      const input = "https://example.com/file.txt";
      const result = sanitizeFilename(input);
      expect(result).toBe("httpsexample.comfile.txt");
    });
  });
});
