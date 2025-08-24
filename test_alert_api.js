/**
 * Comprehensive test for the ViaCRM Alert System
 * Run this from the browser console when logged into EspoCRM
 */

console.log('🧪 Testing ViaCRM Alert System...');

// Test 1: Check if alert system JavaScript is loaded
function testAlertSystemLoad() {
    console.log('\n1. Testing Alert System JavaScript...');
    if (window.ViaCrmAlertSystem) {
        console.log('✅ Alert System JavaScript is loaded');
        console.log('   Available methods:', Object.keys(window.ViaCrmAlertSystem));
        return true;
    } else {
        console.log('❌ Alert System JavaScript not found');
        return false;
    }
}

// Test 2: Test userAlerts API endpoint
function testUserAlertsAPI() {
    console.log('\n2. Testing userAlerts API...');
    return fetch('/api/v1/ViaCrm/Alert/userAlerts', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        console.log('   Response Status:', response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('   Response Data:', data);
        if (data.error) {
            console.error('❌ API Error:', data.error);
            return false;
        } else {
            console.log('✅ userAlerts API working! Found', data.total, 'alerts');
            if (data.list && data.list.length > 0) {
                console.log('   Sample alert:', data.list[0]);
            }
            return true;
        }
    })
    .catch(error => {
        console.error('❌ userAlerts API Failed:', error.message);
        return false;
    });
}

// Test 3: Test markViewed API endpoint
function testMarkViewedAPI() {
    console.log('\n3. Testing markViewed API...');
    return fetch('/api/v1/ViaCrm/Alert/markViewed', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ alertId: 'test123' })
    })
    .then(response => {
        console.log('   Response Status:', response.status, response.statusText);
        return response.json();
    })
    .then(data => {
        console.log('   Response Data:', data);
        if (data.success) {
            console.log('✅ markViewed API working!');
            return true;
        } else {
            console.error('❌ markViewed API returned success=false');
            return false;
        }
    })
    .catch(error => {
        console.error('❌ markViewed API Failed:', error.message);
        return false;
    });
}

// Test 4: Test close API endpoint
function testCloseAPI() {
    console.log('\n4. Testing close API...');
    return fetch('/api/v1/ViaCrm/Alert/close', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ alertId: 'test123' })
    })
    .then(response => {
        console.log('   Response Status:', response.status, response.statusText);
        return response.json();
    })
    .then(data => {
        console.log('   Response Data:', data);
        if (data.success) {
            console.log('✅ close API working!');
            return true;
        } else {
            console.error('❌ close API returned success=false');
            return false;
        }
    })
    .catch(error => {
        console.error('❌ close API Failed:', error.message);
        return false;
    });
}

// Test 5: Check DOM elements
function testDOMElements() {
    console.log('\n5. Testing DOM elements...');
    const container = document.querySelector('#viacrm-alerts');
    if (container) {
        console.log('✅ Alert container found in DOM');
        console.log('   Container element:', container);
        return true;
    } else {
        console.log('❌ Alert container not found in DOM');
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting comprehensive ViaCRM Alert System tests...');
    
    const results = {
        jsLoaded: testAlertSystemLoad(),
        domElements: testDOMElements(),
        userAlertsAPI: await testUserAlertsAPI(),
        markViewedAPI: await testMarkViewedAPI(),
        closeAPI: await testCloseAPI()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    Object.entries(results).forEach(([test, result]) => {
        const status = result ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${test}`);
    });
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🏁 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! ViaCRM Alert System is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Check the errors above.');
        console.log('\n🔧 Troubleshooting tips:');
        console.log('- Clear EspoCRM cache (Administration > Clear Cache)');
        console.log('- Rebuild (Administration > Rebuild)');
        console.log('- Check EspoCRM logs for PHP errors');
        console.log('- Verify the module is installed and enabled');
    }
    
    return results;
}

// Auto-run tests
runAllTests();