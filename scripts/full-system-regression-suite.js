#!/usr/bin/env node

/**
 * Full System Regression Suite
 * Comprehensive execution of all existing test suites
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  outputFile: path.join(__dirname, '../audit-reports/full-system-regression-report.md'),
  testConfigs: [
    { name: 'Jest Simple Tests', command: 'npm run test', config: 'jest.config.simple.js' },
    { name: 'Jest Fixed Tests', command: 'npm run test:fixed', config: 'jest.config.fixed.js' }
  ]
};

class FullSystemRegressionSuite {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      totalSuites: 0,
      executedSuites: 0,
      passedSuites: 0,
      failedSuites: 0,
      testResults: [],
      summary: {
        overallStatus: 'unknown',
        criticalFailures: 0,
        warnings: 0
      }
    };
  }

  async executeRegressionSuite() {
    console.log('🚀 Starting Full System Regression Suite...');
    
    try {
      this.results.totalSuites = config.testConfigs.length;
      
      for (const testConfig of config.testConfigs) {
        await this.executeTestSuite(testConfig);
      }
      
      this.generateSummary();
      await this.writeReport();
      
      console.log('✅ Full System Regression Suite Complete');
      return this.results;
      
    } catch (error) {
      console.error('❌ Regression suite failed:', error);
      return this.results;
    }
  }

  async executeTestSuite(testConfig) {
    console.log(`🔍 Executing ${testConfig.name}...`);
    
    const startTime = Date.now();
    const testResult = {
      name: testConfig.name,
      command: testConfig.command,
      config: testConfig.config,
      status: 'unknown',
      duration: 0,
      output: '',
      error: null
    };

    try {
      const output = execSync(testConfig.command, { 
        encoding: 'utf8', 
        timeout: 300000,
        cwd: path.join(__dirname, '..')
      });
      
      testResult.status = 'passed';
      testResult.output = output;
      testResult.duration = Date.now() - startTime;
      
      this.results.passedSuites++;
      console.log(`✅ ${testConfig.name} passed (${testResult.duration}ms)`);
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.output = error.stdout || '';
      testResult.duration = Date.now() - startTime;
      
      this.results.failedSuites++;
      console.log(`❌ ${testConfig.name} failed: ${error.message}`);
    }

    this.results.executedSuites++;
    this.results.testResults.push(testResult);
  }

  generateSummary() {
    const { totalSuites, failedSuites } = this.results;
    
    if (failedSuites === 0) {
      this.results.summary.overallStatus = 'excellent';
    } else if (failedSuites < totalSuites / 2) {
      this.results.summary.overallStatus = 'good';
    } else {
      this.results.summary.overallStatus = 'poor';
    }
  }

  async writeReport() {
    const reportContent = this.generateReportContent();
    
    const auditDir = path.dirname(config.outputFile);
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }
    
    fs.writeFileSync(config.outputFile, reportContent);
    console.log(`📄 Report written to: ${config.outputFile}`);
  }

  generateReportContent() {
    const { summary, totalSuites, executedSuites, passedSuites, failedSuites, testResults } = this.results;
    
    return `# Full System Regression Suite Report

**Generated**: ${new Date().toISOString()}  
**Suite**: Full System Regression Suite v1.0  

---

## 📊 **EXECUTIVE SUMMARY**

| Metric | Value | Status |
|--------|-------|--------|
| **Total Test Suites** | ${totalSuites} | ✅ |
| **Executed Suites** | ${executedSuites} | ✅ |
| **Passed Suites** | ${passedSuites} | ${passedSuites === totalSuites ? '✅' : '⚠️'} |
| **Failed Suites** | ${failedSuites} | ${failedSuites === 0 ? '✅' : '⚠️'} |
| **Overall Status** | ${summary.overallStatus.toUpperCase()} | ${summary.overallStatus === 'excellent' ? '✅' : '⚠️'} |

---

## 🔍 **TEST SUITE RESULTS**

### **Overall Assessment**
- **Status**: ${summary.overallStatus.toUpperCase()}
- **Success Rate**: ${Math.round((passedSuites/totalSuites)*100)}% (${passedSuites}/${totalSuites})

### **Test Suite Details**

${testResults.map(result => `
#### ${result.name}
- **Status**: ${result.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}
- **Duration**: ${result.duration}ms
- **Command**: \`${result.command}\`
${result.error ? `- **Error**: ${result.error}` : ''}
`).join('\n')}

---

## ✅ **REGRESSION CONCLUSION**

**System Status**: ${summary.overallStatus.toUpperCase()}  
**Ready for Phase 4**: ${summary.overallStatus === 'excellent' || summary.overallStatus === 'good' ? 'YES' : 'REVIEW REQUIRED'}  
**Sign-off Required**: ${failedSuites > 0 ? 'YES - Test failures must be resolved' : 'NO - Ready to proceed'}

---

**Report Generated By**: Full System Regression Suite  
**Status**: ${summary.overallStatus === 'excellent' ? '✅ COMPLETE' : '⚠️ REVIEW REQUIRED'}
`;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Full System Regression Suite...');
  
  const suite = new FullSystemRegressionSuite();
  const results = await suite.executeRegressionSuite();
  
  console.log('\n📊 Regression Summary:');
  console.log(`- Total Suites: ${results.totalSuites}`);
  console.log(`- Passed Suites: ${results.passedSuites}`);
  console.log(`- Failed Suites: ${results.failedSuites}`);
  console.log(`- Overall Status: ${results.summary.overallStatus.toUpperCase()}`);
  
  if (results.failedSuites > 0) {
    console.log('\n❌ Test failures detected - review required');
    process.exit(1);
  } else {
    console.log('\n✅ Regression suite complete - ready for Phase 4');
    process.exit(0);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default FullSystemRegressionSuite;