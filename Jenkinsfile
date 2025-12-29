pipeline {
    agent any
    stages {
        stage('1. Checkout') {
            steps { checkout scm }
        }
        stage('2. Docker Build & Push') {
            steps {
                script {
                    def image = docker.build("shahabb/webapp:${env.BUILD_ID}")
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        stage('3. Start Minikube') {
            steps {
                sh '''
                minikube start --driver=docker || true
                eval $(minikube docker-env)
                '''
            }
        }
        stage('4. Deploy to Kubernetes') {
            steps {
                sh '''
                kubectl apply -f k8s-deployment.yaml
                kubectl rollout status deployment/webapp --timeout=300s
                minikube service webapp-service --url
                '''
            }
        }
    }
    post {
        success {
            echo '🎉 FULL PIPELINE: GitHub→Jenkins→Docker→Kubernetes!'
        }
    }
}
