import { useState, useEffect } from 'react';
import { Select, useToast } from '@chakra-ui/react';
import { companyAPI } from '../services/api';

const CompanySelector = ({
  value,
  onChange,
  required = false,
  placeholder = "Select company (optional)"
}) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await companyAPI.getAll();
      setCompanies(response.data.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: 'Failed to load companies',
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
    <Select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder={placeholder}
      isRequired={required}
      isDisabled={loading}
    >
      {companies.map((company) => (
        <option key={company._id} value={company._id}>
          {company.name}
        </option>
      ))}
    </Select>
  );
};

export default CompanySelector;
