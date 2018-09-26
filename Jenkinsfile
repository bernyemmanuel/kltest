node {
    stage('Preparation') {
     checkout scm
     sh "git rev-parse --short HEAD > .git/commit-id"                        
     commit_id = readFile('.git/commit-id').trim()
    }
    stage('docker build/push') {
     docker.withRegistry('https://index.docker.io/v1/', 'docker-berny') {
      def app = docker.build("bernyemmanuel/staging:${commit_id}", '.').push()
     }
    }
    stage('deploy to prod') {
    sshPublisher(publishers: [sshPublisherDesc(configName: 'bastion-host-prod', transfers: [sshTransfer(excludes: '', execCommand: """cd /root/staging
rm -rf berny_api_jenkins_build.yaml
sed \'s/TAG/${commit_id}/g\' berny_api_jenkins_default.yaml > berny_api_jenkins_build.yaml
kubectl apply -f berny_api_jenkins_build.yaml""", execTimeout: 120000, flatten: false, makeEmptyDirs: false, noDefaultExcludes: false, patternSeparator: '[, ]+', remoteDirectory: '', remoteDirectorySDF: false, removePrefix: '', sourceFiles: '')], usePromotionTimestamp: false, useWorkspaceInPromotion: false, verbose: false)])

    }
}
