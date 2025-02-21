import React from 'react';
import { Echo } from '../Echo';

// 定义计数器状态类型
interface CounterState {
	count: number;
	lastUpdated: string;
}

// 创建Echo实例
const counterEcho = new Echo<CounterState>(
	{
		count: 0,
		lastUpdated: new Date().toISOString()
	},
	{
		name: 'counter-example', // 启用本地存储
		sync: true, // 启用跨窗口同步
		storage: "indexedDB",
		onChange: (state) => {
			console.log('状态已更新:', state);
		}
	}
);

// 计数器组件
export function Counter() {
	// 使用Echo的use hook获取状态
	const { count, lastUpdated } = counterEcho.use();

	// 更新计数器
	const increment = () => {
		counterEcho.set((state) => ({
			count: state.count + 1,
			lastUpdated: new Date().toISOString()
		}));
	};

	const decrement = () => {
		counterEcho.set((state) => ({
			count: state.count - 1,
			lastUpdated: new Date().toISOString()
		}));
	};

	const reset = () => {
		counterEcho.reset();
	};

	return (
		<div style={{
			padding: '2rem',
			maxWidth: '600px',
			margin: '0 auto',
			fontFamily: 'system-ui, -apple-system, sans-serif'
		}}>
			<h2 style={{
				fontSize: '1.8rem',
				color: '#2563eb',
				marginBottom: '1.5rem',
				textAlign: 'center'
			}}>Echo 计数器示例</h2>

			<div style={{
				background: '#f8fafc',
				padding: '1.5rem',
				borderRadius: '0.5rem',
				boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
				marginBottom: '1.5rem'
			}}>
				<p style={{ fontSize: '1.25rem', fontWeight: '500' }}>
					当前计数: <span style={{ color: '#2563eb' }}>{count}</span>
				</p>
				<p style={{ color: '#64748b', fontSize: '0.875rem' }}>
					最后更新: {new Date(lastUpdated).toLocaleString()}
				</p>
			</div>

			<div style={{
				display: 'flex',
				gap: '0.75rem',
				justifyContent: 'center',
				marginBottom: '2rem'
			}}>
				<button onClick={decrement} style={{
					padding: '0.5rem 1rem',
					background: '#ef4444',
					color: 'white',
					border: 'none',
					borderRadius: '0.375rem',
					cursor: 'pointer',
					fontWeight: '500',
					transition: 'background 0.2s'
				}}>减少</button>
				<button onClick={increment} style={{
					padding: '0.5rem 1rem',
					background: '#2563eb',
					color: 'white',
					border: 'none',
					borderRadius: '0.375rem',
					cursor: 'pointer',
					fontWeight: '500',
					transition: 'background 0.2s'
				}}>增加</button>
				<button onClick={reset} style={{
					padding: '0.5rem 1rem',
					background: '#64748b',
					color: 'white',
					border: 'none',
					borderRadius: '0.375rem',
					cursor: 'pointer',
					fontWeight: '500',
					transition: 'background 0.2s'
				}}>重置</button>
			</div>

			<div style={{
				background: '#f8fafc',
				padding: '1.5rem',
				borderRadius: '0.5rem',
				boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
			}}>
				<p style={{
					fontWeight: '500',
					marginBottom: '0.75rem',
					color: '#1e293b'
				}}>功能演示：</p>
				<ul style={{
					listStyleType: 'none',
					padding: 0,
					margin: 0
				}}>
					{[
						'状态管理',
						'本地存储（刷新页面后状态保持）',
						'跨窗口同步（打开多个窗口测试）',
						'React Hooks 集成'
					].map((item, index) => (
						<li key={index} style={{
							padding: '0.5rem 0',
							color: '#64748b',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem'
						}}>
							<span style={{
								width: '6px',
								height: '6px',
								borderRadius: '50%',
								background: '#2563eb',
								display: 'inline-block'
							}}></span>
							{item}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

// 在组件外部使用
const exampleUsage = () => {
	// 订阅状态变化
	const unsubscribe = counterEcho.subscribe((state) => {
		console.log('状态变化:', state);
	});

	// 直接修改状态
	counterEcho.set({ count: 10 });

	// 使用更新函数修改状态
	counterEcho.set(state => ({
		count: state.count * 2
	}));

	// 取消订阅
	unsubscribe();
}; 