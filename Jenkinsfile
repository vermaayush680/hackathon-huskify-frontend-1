pipeline {
    agent any

    tools {
        nodejs 'node18'
    }

    environment {
        REGION = 'europe-west2'
        PROJECT_ID = 'ltc-reboot25-team-26'
        REPO_NAME = 'huskify'
        IMAGE_NAME = 'huskify-front-app'
        TAG = "${env.BUILD_NUMBER}"
        GAR_URL = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}"
        DOCKER_IMAGE = "${GAR_URL}:${TAG}"
        CLUSTER_NAME = "cluster-1"
        ZONE = "us-central1"
        // GCLOUD_KEY = credentials('gar')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'huskify-fe-sm', 
                    credentialsId: 'github', 
                    url: 'https://github.com/vermaayush680/hackathon-huskify-frontend.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "🔨 Building Docker image..."
                sh 'docker --version'
                sh 'kubectl version --client'
                sh "docker build -t ${DOCKER_IMAGE} ."
                sh "docker images"
            }
        }

        stage('Authenticate with GCP') {
            steps {
                withCredentials([file(credentialsId: 'gar', variable: 'GCP_KEY')]) {
                    sh '''
                        gcloud auth activate-service-account --key-file=$GCP_KEY
                        gcloud config set project ${PROJECT_ID}
                        gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
                    '''
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                echo "📦 Pushing Docker image to GAR..."
                sh "docker push ${DOCKER_IMAGE}"
            }
        }

        stage('Authenticate to GKE') {
            steps {
                echo "🔗 Connecting to GKE cluster..."
                withCredentials([file(credentialsId: 'gke', variable: 'GKE_KEY')]) {
                    sh '''
                        gcloud auth activate-service-account --key-file=$GKE_KEY
                        gcloud container clusters get-credentials $CLUSTER_NAME \
                          --zone $ZONE \
                          --project $PROJECT_ID
                        sed -i "s|BUILD_TAG|${BUILD_NUMBER}|g" Deployment.yaml
                        kubectl apply -f Deployment.yaml
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '✅ Build and tests succeeded!'
        }
        failure {
            echo '❌ Build or tests failed.'
        }
    }
}
