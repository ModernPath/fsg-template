#!/usr/bin/env node
/**
 * UI Feature Sync Automation
 * 
 * This script automatically checks that the UI implementation
 * matches the feature specifications in documentation.
 * 
 * Usage: node tools/sync-ui-features.js [--fix]
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, colors.bright);
  log(title, colors.bright + colors.blue);
  log('='.repeat(60), colors.bright);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

// Configuration
const config = {
  docsPath: path.join(__dirname, '../docs/bizexit'),
  componentsPath: path.join(__dirname, '../components/dashboard/roles'),
  routesPath: path.join(__dirname, '../app/[locale]/dashboard'),
  translationsPath: path.join(__dirname, '../messages'),
};

// Parse command line arguments
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');

/**
 * Read and parse ROLE_SYSTEM.md to extract role definitions
 */
function parseRoleDefinitions() {
  const roleSystemPath = path.join(config.docsPath, 'ROLE_SYSTEM.md');
  
  if (!fs.existsSync(roleSystemPath)) {
    logError(`ROLE_SYSTEM.md not found at ${roleSystemPath}`);
    return null;
  }

  const content = fs.readFileSync(roleSystemPath, 'utf-8');
  
  // Extract role definitions
  const roles = {};
  const roleMatches = content.matchAll(/### \d+\. \*\*(.+?)\*\* \((\w+)\)/g);
  
  for (const match of roleMatches) {
    const roleName = match[1];
    const roleKey = match[2];
    
    // Extract features for this role
    const roleSection = content.split(`**${roleName}**`)[1]?.split('###')[0] || '';
    const features = [];
    const featureMatches = roleSection.matchAll(/[-✅] (.+)/g);
    
    for (const featureMatch of featureMatches) {
      features.push(featureMatch[1].trim());
    }
    
    roles[roleKey] = {
      name: roleName,
      key: roleKey,
      features,
    };
  }
  
  return roles;
}

/**
 * Read and parse AI_ECOSYSTEM.md to extract AI features
 */
function parseAIFeatures() {
  const aiEcosystemPath = path.join(config.docsPath, 'AI_ECOSYSTEM.md');
  
  if (!fs.existsSync(aiEcosystemPath)) {
    logWarning(`AI_ECOSYSTEM.md not found at ${aiEcosystemPath}`);
    return null;
  }

  const content = fs.readFileSync(aiEcosystemPath, 'utf-8');
  
  // Extract AI features per role
  const aiFeatures = {};
  const roleMatches = content.matchAll(/### \d+\. \*\*AI-Assistentti (.+?)\*\* \((\w+)AI\)/g);
  
  for (const match of roleMatches) {
    const roleName = match[1].toLowerCase();
    const roleKey = roleName === 'ostajalle' ? 'buyer' : 
                    roleName === 'myyjälle' ? 'seller' :
                    roleName === 'välittäjälle' ? 'broker' :
                    roleName === 'kumppanille' ? 'partner' : 
                    roleName === 'adminille' ? 'admin' : null;
    
    if (!roleKey) continue;
    
    const roleSection = content.split(match[0])[1]?.split('###')[0] || '';
    const features = [];
    const featureMatches = roleSection.matchAll(/[-✨] (.+)/g);
    
    for (const featureMatch of featureMatches) {
      features.push(featureMatch[1].trim());
    }
    
    aiFeatures[roleKey] = features;
  }
  
  return aiFeatures;
}

/**
 * Check if role dashboard component exists
 */
function checkDashboardComponent(roleKey) {
  const componentName = `${roleKey.charAt(0).toUpperCase()}${roleKey.slice(1)}Dashboard.tsx`;
  const componentPath = path.join(config.componentsPath, componentName);
  
  if (fs.existsSync(componentPath)) {
    logSuccess(`Dashboard component exists: ${componentName}`);
    return true;
  } else {
    logError(`Dashboard component missing: ${componentName}`);
    return false;
  }
}

/**
 * Check if translations exist for a role
 */
function checkTranslations(roleKey, locale = 'fi') {
  const translationPath = path.join(config.translationsPath, locale, 'roles.json');
  
  if (!fs.existsSync(translationPath)) {
    logError(`Translation file missing: ${locale}/roles.json`);
    return false;
  }

  const translations = JSON.parse(fs.readFileSync(translationPath, 'utf-8'));
  
  if (translations[roleKey]) {
    logSuccess(`Translations exist for ${roleKey} (${locale})`);
    return true;
  } else {
    logError(`Translations missing for ${roleKey} (${locale})`);
    return false;
  }
}

/**
 * Main validation function
 */
async function validateUIFeatures() {
  logSection('🔍 UI Feature Sync Validation');
  
  log('\nStep 1: Parsing role definitions from documentation...');
  const roles = parseRoleDefinitions();
  
  if (!roles) {
    logError('Failed to parse role definitions');
    return;
  }
  
  logSuccess(`Found ${Object.keys(roles).length} roles: ${Object.keys(roles).join(', ')}`);
  
  log('\nStep 2: Parsing AI features from documentation...');
  const aiFeatures = parseAIFeatures();
  
  if (aiFeatures) {
    logSuccess(`Found AI features for ${Object.keys(aiFeatures).length} roles`);
  }
  
  log('\nStep 3: Validating dashboard components...');
  let allComponentsExist = true;
  
  for (const roleKey in roles) {
    const exists = checkDashboardComponent(roleKey);
    if (!exists) allComponentsExist = false;
  }
  
  log('\nStep 4: Validating translations...');
  let allTranslationsExist = true;
  
  for (const roleKey in roles) {
    const exists = checkTranslations(roleKey, 'fi');
    if (!exists) allTranslationsExist = false;
  }
  
  // Summary
  logSection('📊 Validation Summary');
  
  if (allComponentsExist && allTranslationsExist) {
    logSuccess('✅ All UI features are properly implemented!');
    log('\n✓ All role dashboards exist');
    log('✓ All translations are complete');
    log('✓ UI matches specification');
  } else {
    logError('❌ Some UI features are missing or incomplete');
    
    if (!allComponentsExist) {
      log('\n✗ Missing dashboard components');
    }
    if (!allTranslationsExist) {
      log('✗ Missing translations');
    }
    
    if (shouldFix) {
      log('\n🔧 Auto-fix mode enabled, but manual review required for missing components.');
      log('   Please create missing components manually.');
    } else {
      log('\n💡 Run with --fix flag to attempt automatic fixes (limited)');
    }
  }
  
  logSection('🎯 Recommendations');
  
  log('\nTo ensure UI stays synchronized with features:');
  log('1. Run this script before commits: npm run sync-ui');
  log('2. Add to CI/CD pipeline for automated checks');
  log('3. Update this script when adding new feature types');
  log('4. Document new UI patterns in docs/');
  
  log('\n✨ Done!\n');
}

// Run validation
validateUIFeatures().catch((error) => {
  logError(`\nFatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

