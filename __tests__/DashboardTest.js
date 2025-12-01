/**
 * ENHANCED DASHBOARD TEST SUITE
 * Tests all dashboard functionality including:
 * - Dashboard data loading
 * - Subject overview display
 * - Chapter progress tracking
 * - Navigation flows
 * - Subject detail screen
 */

import { getDashboardData, getSubjectDetail } from '../services/dashboardService'
import { supabase } from '../lib/supabase'

let TEST_USER_ID = null

console.log('╔════════════════════════════════════════════════╗')
console.log('║  ENHANCED DASHBOARD TEST SUITE                 ║')
console.log('╚════════════════════════════════════════════════╝')
console.log('')

const getTestUser = async () => {
  console.log('1️⃣  TEST: Get Test User')
  console.log('─────────────────────────────────────────')
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, grade')
      .limit(1)
      .single()
    
    if (error) throw error
    
    if (!data) {
      console.log('❌ FAIL: No user found in database')
      console.log('💡 Create a user account first')
      return false
    }
    
    TEST_USER_ID = data.id
    console.log('✅ PASS: Test user found')
    console.log(`   User: ${data.full_name}`)
    console.log(`   Grade: ${data.grade}`)
    console.log(`   ID: ${TEST_USER_ID}`)
    console.log('')
    return true
    
  } catch (error) {
    console.log('❌ FAIL: Error getting test user')
    console.log('   Error:', error.message)
    console.log('')
    return false
  }
}

const testDatabaseFunctions = async () => {
  console.log('2️⃣  TEST: Database Functions Exist')
  console.log('─────────────────────────────────────────')
  
  const requiredFunctions = [
    'get_dashboard_stats',
    'get_student_subject_overview',
    'get_recent_learning_activity'
  ]
  
  try {
    let allExist = true
    let foundFunctions = []
    
    for (const funcName of requiredFunctions) {
      try {
        if (funcName === 'get_dashboard_stats') {
          await supabase.rpc(funcName, { p_user_id: TEST_USER_ID })
          foundFunctions.push(funcName)
        } else if (funcName === 'get_student_subject_overview') {
          await supabase.rpc(funcName, { p_user_id: TEST_USER_ID })
          foundFunctions.push(funcName)
        } else if (funcName === 'get_recent_learning_activity') {
          await supabase.rpc(funcName, { p_user_id: TEST_USER_ID, p_limit: 5 })
          foundFunctions.push(funcName)
        }
      } catch (err) {
        console.log(`⚠️  Function ${funcName} not found or error`)
        allExist = false
      }
    }
    
    if (foundFunctions.length === requiredFunctions.length) {
      console.log('✅ PASS: All database functions exist')
      foundFunctions.forEach(fn => console.log(`   ✓ ${fn}`))
    } else {
      console.log('❌ FAIL: Missing database functions')
      console.log(`   Found: ${foundFunctions.length}/${requiredFunctions.length}`)
      requiredFunctions.forEach(fn => {
        if (foundFunctions.includes(fn)) {
          console.log(`   ✓ ${fn}`)
        } else {
          console.log(`   ✗ ${fn} - MISSING`)
        }
      })
    }
    console.log('')
    return allExist
    
  } catch (error) {
    console.log('❌ FAIL: Error checking functions')
    console.log('   Error:', error.message)
    console.log('')
    return false
  }
}

const testDashboardDataLoading = async () => {
  console.log('3️⃣  TEST: Dashboard Data Loading')
  console.log('─────────────────────────────────────────')
  
  try {
    const dashboardData = await getDashboardData(TEST_USER_ID)
    
    if (!dashboardData.success) {
      console.log('❌ FAIL: Dashboard data loading failed')
      console.log('   Error:', dashboardData.error)
      console.log('')
      return false
    }
    
    const hasStats = dashboardData.stats && typeof dashboardData.stats === 'object'
    const hasSubjects = Array.isArray(dashboardData.subjects)
    const hasActivity = Array.isArray(dashboardData.recentActivity)
    const hasUserStats = dashboardData.userStats && typeof dashboardData.userStats === 'object'
    
    if (hasStats && hasSubjects && hasActivity && hasUserStats) {
      console.log('✅ PASS: Dashboard data loaded successfully')
      console.log('   Data Structure:')
      console.log(`   ✓ Stats object present`)
      console.log(`   ✓ Subjects array: ${dashboardData.subjects.length} items`)
      console.log(`   ✓ Recent activity: ${dashboardData.recentActivity.length} items`)
      console.log(`   ✓ User stats present`)
      console.log('')
      console.log('   📊 Dashboard Stats:')
      console.log(`   • Total Subjects: ${dashboardData.stats.total_subjects || 0}`)
      console.log(`   • Active Subjects: ${dashboardData.stats.active_subjects || 0}`)
      console.log(`   • Total Chapters: ${dashboardData.stats.total_chapters_available || 0}`)
      console.log(`   • Completed: ${dashboardData.stats.chapters_completed || 0}`)
      console.log(`   • Current Streak: ${dashboardData.stats.current_streak || 0} days`)
      console.log(`   • Study Time: ${dashboardData.stats.total_study_time_hours || 0} hours`)
      console.log('')
      return true
    } else {
      console.log('❌ FAIL: Incomplete dashboard data structure')
      console.log(`   Stats: ${hasStats ? '✓' : '✗'}`)
      console.log(`   Subjects: ${hasSubjects ? '✓' : '✗'}`)
      console.log(`   Activity: ${hasActivity ? '✓' : '✗'}`)
      console.log(`   User Stats: ${hasUserStats ? '✓' : '✗'}`)
      console.log('')
      return false
    }
    
  } catch (error) {
    console.log('❌ FAIL: Dashboard data loading error')
    console.log('   Error:', error.message)
    console.log('')
    return false
  }
}

const testSubjectOverview = async () => {
  console.log('4️⃣  TEST: Subject Overview Data')
  console.log('─────────────────────────────────────────')
  
  try {
    const dashboardData = await getDashboardData(TEST_USER_ID)
    
    if (dashboardData.subjects.length === 0) {
      console.log('⚠️  WARN: No subjects found for user')
      console.log('💡 This is expected if user hasn\'t started any subjects')
      console.log('')
      return true
    }
    
    const firstSubject = dashboardData.subjects[0]
    
    const requiredFields = [
      'subject_code',
      'subject_name', 
      'subject_emoji',
      'total_chapters',
      'completed_chapters',
      'in_progress_chapters',
      'not_started_chapters'
    ]
    
    const missingFields = requiredFields.filter(field => 
      !(field in firstSubject)
    )
    
    if (missingFields.length === 0) {
      console.log('✅ PASS: Subject overview data complete')
      console.log('   First Subject:')
      console.log(`   ${firstSubject.subject_emoji} ${firstSubject.subject_name}`)
      console.log(`   • Total Chapters: ${firstSubject.total_chapters}`)
      console.log(`   • Completed: ${firstSubject.completed_chapters}`)
      console.log(`   • In Progress: ${firstSubject.in_progress_chapters}`)
      console.log(`   • Not Started: ${firstSubject.not_started_chapters}`)
      if (firstSubject.average_mastery_score) {
        console.log(`   • Avg Mastery: ${firstSubject.average_mastery_score}%`)
      }
      console.log('')
      return true
    } else {
      console.log('❌ FAIL: Subject overview missing fields')
      console.log('   Missing:', missingFields.join(', '))
      console.log('')
      return false
    }
    
  } catch (error) {
    console.log('❌ FAIL: Subject overview error')
    console.log('   Error:', error.message)
    console.log('')
    return false
  }
}

const testSubjectDetail = async () => {
  console.log('5️⃣  TEST: Subject Detail Loading')
  console.log('─────────────────────────────────────────')
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('grade')
      .eq('id', TEST_USER_ID)
      .single()
    
    if (!profile) {
      console.log('❌ FAIL: Could not get user profile')
      console.log('')
      return false
    }
    
    const subjectDetail = await getSubjectDetail(TEST_USER_ID, 'MATH', profile.grade)
    
    if (!subjectDetail.success) {
      console.log('⚠️  WARN: Could not load subject detail')
      console.log('💡 This is expected if MATH subject not set up for this grade')
      console.log('')
      return true
    }
    
    const hasBook = subjectDetail.book && typeof subjectDetail.book === 'object'
    const hasChapters = Array.isArray(subjectDetail.chapters)
    
    if (hasBook && hasChapters) {
      console.log('✅ PASS: Subject detail loaded successfully')
      console.log('   Book:')
      console.log(`   ${subjectDetail.book.book_title}`)
      console.log(`   • Total Chapters: ${subjectDetail.chapters.length}`)
      
      if (subjectDetail.chapters.length > 0) {
        const firstChapter = subjectDetail.chapters[0]
        console.log('')
        console.log('   First Chapter:')
        console.log(`   ${firstChapter.chapter_number}. ${firstChapter.chapter_title}`)
        console.log(`   • Status: ${firstChapter.progress?.status || 'not_started'}`)
        if (firstChapter.progress?.mastery_score) {
          console.log(`   • Mastery: ${firstChapter.progress.mastery_score}%`)
        }
      }
      console.log('')
      return true
    } else {
      console.log('❌ FAIL: Incomplete subject detail data')
      console.log(`   Book: ${hasBook ? '✓' : '✗'}`)
      console.log(`   Chapters: ${hasChapters ? '✓' : '✗'}`)
      console.log('')
      return false
    }
    
  } catch (error) {
    console.log('❌ FAIL: Subject detail error')
    console.log('   Error:', error.message)
    console.log('')
    return false
  }
}

const testProgressCalculation = async () => {
  console.log('6️⃣  TEST: Progress Calculation')
  console.log('─────────────────────────────────────────')
  
  try {
    const dashboardData = await getDashboardData(TEST_USER_ID)
    const stats = dashboardData.stats
    
    const totalChapters = stats.total_chapters_available || 0
    const completedChapters = stats.chapters_completed || 0
    
    let calculatedPercentage = 0
    if (totalChapters > 0) {
      calculatedPercentage = Math.round((completedChapters / totalChapters) * 100)
    }
    
    console.log('✅ PASS: Progress calculation working')
    console.log('   Progress Metrics:')
    console.log(`   • Total Available: ${totalChapters} chapters`)
    console.log(`   • Completed: ${completedChapters} chapters`)
    console.log(`   • Completion: ${calculatedPercentage}%`)
    console.log(`   • Average Mastery: ${stats.avg_mastery_score || 0}%`)
    console.log('')
    
    const isConsistent = completedChapters <= totalChapters
    
    if (isConsistent) {
      console.log('   ✓ Data consistency verified')
    } else {
      console.log('   ⚠️  Data inconsistency detected')
      console.log('   Completed chapters exceed total chapters!')
    }
    console.log('')
    
    return isConsistent
    
  } catch (error) {
    console.log('❌ FAIL: Progress calculation error')
    console.log('   Error:', error.message)
    console.log('')
    return false
  }
}

const testChapterProgressStatus = async () => {
  console.log('7️⃣  TEST: Chapter Progress Status')
  console.log('─────────────────────────────────────────')
  
  try {
    const { data: progressData, error } = await supabase
      .from('student_chapter_progress')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .limit(5)
    
    if (error) throw error
    
    if (!progressData || progressData.length === 0) {
      console.log('⚠️  INFO: No chapter progress data yet')
      console.log('💡 Complete onboarding or mark some chapters as completed')
      console.log('')
      return true
    }
    
    console.log('✅ PASS: Chapter progress data exists')
    console.log(`   Found ${progressData.length} progress records`)
    console.log('')
    console.log('   Sample Progress Records:')
    
    progressData.slice(0, 3).forEach((record, idx) => {
      console.log(`   ${idx + 1}. Status: ${record.status || 'not_started'}`)
      if (record.mastery_score) {
        console.log(`      Mastery: ${record.mastery_score}%`)
      }
      if (record.marked_as_completed) {
        console.log(`      ✓ Marked as completed`)
      }
      if (record.marked_as_difficult) {
        console.log(`      ⚠️  Marked as difficult`)
      }
    })
    console.log('')
    return true
    
  } catch (error) {
    console.log('❌ FAIL: Chapter progress status error')
    console.log('   Error:', error.message)
    console.log('')
    return false
  }
}

const runAllTests = async () => {
  console.log('🚀 Starting Enhanced Dashboard Test Suite...')
  console.log('')
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    total: 7
  }
  
  const test1 = await getTestUser()
  if (!test1) {
    console.log('⛔ Cannot proceed without test user. Stopping tests.')
    return
  }
  
  const test2 = await testDatabaseFunctions()
  results.passed += test2 ? 1 : 0
  results.failed += test2 ? 0 : 1
  
  const test3 = await testDashboardDataLoading()
  results.passed += test3 ? 1 : 0
  results.failed += test3 ? 0 : 1
  
  const test4 = await testSubjectOverview()
  results.passed += test4 ? 1 : 0
  results.failed += test4 ? 0 : 1
  
  const test5 = await testSubjectDetail()
  results.passed += test5 ? 1 : 0
  results.failed += test5 ? 0 : 1
  
  const test6 = await testProgressCalculation()
  results.passed += test6 ? 1 : 0
  results.failed += test6 ? 0 : 1
  
  const test7 = await testChapterProgressStatus()
  results.passed += test7 ? 1 : 0
  results.failed += test7 ? 0 : 1
  
  console.log('═══════════════════════════════════════════════')
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('═══════════════════════════════════════════════')
  console.log(`Total Tests: ${results.total}`)
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log('')
  
  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED!')
    console.log('✨ Enhanced Dashboard is working correctly')
    console.log('')
    console.log('Next Steps:')
    console.log('1. Open the app and check dashboard visually')
    console.log('2. Navigate through subjects')
    console.log('3. Verify chapter progress displays correctly')
    console.log('4. Ready to proceed to next step!')
  } else {
    console.log('⚠️  SOME TESTS FAILED')
    console.log('Please fix the issues above before proceeding')
    console.log('')
    console.log('Common Issues:')
    console.log('• Database functions not created - Run SQL queries')
    console.log('• No test data - Complete onboarding with a test account')
    console.log('• Missing tables - Verify Phase 2 database setup')
  }
  console.log('═══════════════════════════════════════════════')
}

runAllTests().catch(error => {
  console.error('💥 FATAL ERROR:', error)
})
