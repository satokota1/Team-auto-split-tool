import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { migratePlayerRates } from './migratePlayerRates'
import { Player } from '@/types'

// 既存プレイヤーのレートデータを移行する関数
export async function migrateExistingPlayers() {
  try {
    console.log('既存プレイヤーのレートデータ移行を開始します...')
    
    // 既存のプレイヤーデータを取得
    const querySnapshot = await getDocs(collection(db, 'players'))
    const players = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (Player & { id: string })[]

    console.log(`${players.length}人のプレイヤーが見つかりました`)

    // 各プレイヤーのデータを移行
    const migrationPromises = players.map(async (player) => {
      // 既に移行済みかチェック（mainRateとsubRateが存在する場合）
      if (player.mainRate !== undefined && player.subRate !== undefined) {
        console.log(`プレイヤー ${player.name} は既に移行済みです`)
        return
      }

      // 古い形式のデータを新しい形式に移行
      const migratedPlayer = migratePlayerRates(player)
      
      // Firestoreを更新
      const playerRef = doc(db, 'players', player.id)
      await updateDoc(playerRef, {
        mainRate: migratedPlayer.mainRate,
        subRate: migratedPlayer.subRate
      })

      console.log(`プレイヤー ${player.name} の移行完了: メイン${migratedPlayer.mainRate} → サブ${migratedPlayer.subRate}`)
    })

    await Promise.all(migrationPromises)
    
    console.log('全てのプレイヤーの移行が完了しました！')
    return { success: true, migratedCount: players.length }
  } catch (error) {
    console.error('移行中にエラーが発生しました:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// 移行を実行する関数（開発者用）
export async function runMigration() {
  const result = await migrateExistingPlayers()
  
  if (result.success) {
    alert(`移行が完了しました！\n${result.migratedCount}人のプレイヤーを移行しました。`)
  } else {
    alert(`移行に失敗しました: ${result.error}`)
  }
  
  return result
}
