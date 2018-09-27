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
    
    stage('deploy to DEV') {
        sshPublisher(publishers: [sshPublisherDesc(configName: 'bastion-host-dev', transfers: [sshTransfer(excludes: '', 
                execCommand: """cd /root/staging
                rm -rf berny_api_jenkins_build.yaml
                sed \'s/TAG/${commit_id}/g\' berny_api_jenkins_default.yaml > berny_api_jenkins_build.yaml
                kubectl apply -f berny_api_jenkins_build.yaml""", execTimeout: 120000, flatten: false, makeEmptyDirs: false, noDefaultExcludes: false, patternSeparator: '[, ]+', remoteDirectory: '', remoteDirectorySDF: false, removePrefix: '', sourceFiles: '')], usePromotionTimestamp: false, useWorkspaceInPromotion: false, verbose: false)])

    }
    
    stage('deploy to prod') {
        def userInput = true
        def didTimeout = false
        try {
            timeout(time: 15, unit: 'SECONDS') { // change to a convenient timeout for you
                userInput = input(
                id: 'Proceed1', message: 'Was this successful?', parameters: [
                [$class: 'BooleanParameterDefinition', defaultValue: true, description: '', name: 'Please confirm you agree with this']
                ])
            }
        } catch(err) { // timeout reached or input false
            def user = err.getCauses()[0].getUser()
            if('SYSTEM' == user.toString()) { // SYSTEM means timeout.
                didTimeout = true
            } else {
                userInput = false
                echo "Aborted by: [${user}]"
            }
        }
        
        if (didTimeout) {
                // do something on timeout
                echo "Build was not successful to Production since no input"
        } else if (userInput == true) {
        sshPublisher(publishers: [sshPublisherDesc(configName: 'bastion-host-prod', transfers: [sshTransfer(excludes: '', 
            execCommand: """cd /root/staging
                        rm -rf berny_api_jenkins_build.yaml
                        sed \'s/TAG/${commit_id}/g\' berny_api_jenkins_default.yaml > berny_api_jenkins_build.yaml
                        kubectl apply -f berny_api_jenkins_build.yaml""", execTimeout: 120000, flatten: false, makeEmptyDirs: false, noDefaultExcludes: false, patternSeparator: '[, ]+', remoteDirectory: '', remoteDirectorySDF: false, removePrefix: '', sourceFiles: '')], usePromotionTimestamp: false, useWorkspaceInPromotion: false, verbose: false)])
                
                echo "this was successful"
        } else {
                // do something else
                echo "Production build not successful due to request rejection"
                currentBuild.result = 'SUCCESS'
        } 

    }
    
    
}
