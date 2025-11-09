import { useState } from 'react';
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
} from '@chakra-ui/react';
import { exportAPI } from '../services/api';

const ExportButton = ({ filters = {} }) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleExport = async (format) => {
    setLoading(true);
    try {
      let response;
      let filename;
      let mimeType;

      // Build export parameters
      const params = { ...filters };

      switch (format) {
        case 'csv':
          response = await exportAPI.exportCSV(params);
          filename = 'daily-updates.csv';
          mimeType = 'text/csv';
          break;
        case 'json':
          response = await exportAPI.exportJSON(params);
          filename = 'daily-updates.json';
          mimeType = 'application/json';
          break;
        case 'markdown':
          response = await exportAPI.exportMarkdown(params);
          filename = 'daily-updates.md';
          mimeType = 'text/markdown';
          break;
        case 'pdf':
          response = await exportAPI.exportPDF(params);
          filename = 'daily-updates.pdf';
          mimeType = 'application/pdf';
          break;
        default:
          throw new Error('Invalid export format');
      }

      // Create blob and trigger download
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export successful!',
        description: `Downloaded ${filename}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Export failed',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Menu>
      <MenuButton
        as={Button}
        colorScheme="teal"
        isLoading={loading}
        variant="outline"
      >
        📥 Export
      </MenuButton>
      <MenuList>
        <MenuItem icon="📄" onClick={() => handleExport('csv')}>
          Export as CSV
        </MenuItem>
        <MenuItem icon="📋" onClick={() => handleExport('json')}>
          Export as JSON
        </MenuItem>
        <MenuItem icon="📝" onClick={() => handleExport('markdown')}>
          Export as Markdown
        </MenuItem>
        <MenuItem icon="📕" onClick={() => handleExport('pdf')}>
          Export as PDF
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default ExportButton;
