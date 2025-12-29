pipeline {
    agent any
    stages {
        stage('1. Checkout') { steps { checkout scm } }
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
        stage('3. Kubernetes Setup') {
            steps {
                sh '''
                # Clean Minikube
                minikube delete --all --purge || true
                
                # Start with t3.small resources
                minikube start --driver=docker --memory=2048mb --cpus=2 --wait=all
                
                # Set context + verify
                eval $(minikube docker-env)
                kubectl config use-context minikube
                kubectl cluster-info
                '''
            }
        }
        stage('4. Deploy K8s') {
            steps {
                sh '''
                kubectl apply -f k8s-deployment.yaml
                kubectl rollout status deployment/webapp --timeout=5m
                kubectl wait --for=condition=Available deployment/webapp --timeout=300s
                '''
            }
        }
        stage('5. Expose App') {
            steps {
                sh '''
                minikube tunnel &
                sleep 10
                minikube service webapp-service --url
                '''
            }
        }
        stage('6. Monitoring Setup') {
            steps {
                sh '''
                helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true
                helm repo update
                helm upgrade --install monitoring prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace
                '''
            }
        }
    }
    post {
        always {
            sh 'kubectl get pods,svc -A || true'
            sh 'minikube status || true'
        }
        success {
            echo '🎉 ALL 6 OBJECTIVES COMPLETE!'
            echo '🌐 App: $(minikube service webapp-service --url)'
            echo '📊 Grafana: kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80'
        }
    }
}
