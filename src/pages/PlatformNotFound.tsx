import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";

const PlatformNotFound = () => {
  const navigate = useNavigate();
  const { platform } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Platform Not Found
          </CardTitle>
          <CardDescription>
            The platform "{platform}" doesn't exist or isn't available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Please select a valid platform from our available options.
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
              size="lg"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Platform Selection
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()} 
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformNotFound;
