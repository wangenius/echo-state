import React, { useEffect } from 'react';
import { Echo } from '../Echo';

// 定义计数器状态类型
interface CounterState {
	count: number;
	lastUpdated: string;
	history: number[];  // 添加历史记录
	settings: {
		step: number;     // 步进值
		autoIncrement: boolean; // 自动增加开关
	};
}

// 创建Echo实例
const counterEcho = new Echo<CounterState>(
	{
		count: 0,
		lastUpdated: new Date().toISOString(),
		history: [],
		settings: {
			step: 1,
			autoIncrement: false
		}
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
	// 使用选择器只获取需要的状态
	const count = counterEcho.use(state => state.count);
	const { step, autoIncrement } = counterEcho.use(state => state.settings);
	const history = counterEcho.use(state => state.history);
	const lastUpdated = counterEcho.use(state => state.lastUpdated);

	// 自动增加计数器
	useEffect(() => {
		let timer: number;
		if (autoIncrement) {
			timer = window.setInterval(() => {
				increment();
			}, 1000);
		}
		return () => clearInterval(timer);
	}, [autoIncrement]);

	// 更新计数器
	const increment = () => {
		counterEcho.set((state) => ({
			count: state.count + state.settings.step,
			lastUpdated: new Date().toISOString(),
			history: [...state.history, state.count]
		}));
	};

	const decrement = () => {
		counterEcho.set((state) => ({
			count: state.count - state.settings.step,
			lastUpdated: new Date().toISOString(),
			history: [...state.history, state.count]
		}));
	};

	const reset = () => {
		counterEcho.reset();
	};

	const updateStep = (newStep: number) => {
		counterEcho.set((state) => ({
			settings: {
				...state.settings,
				step: newStep
			}
		}));
	};

	const toggleAutoIncrement = () => {
		counterEcho.set((state) => ({
			settings: {
				...state.settings,
				autoIncrement: !state.settings.autoIncrement
			}
		}));
	};

	const clearHistory = () => {
		counterEcho.set(() => ({
			history: []
		}));
	};

	// 添加删除单个历史记录条目的方法
	const deleteHistoryItem = (index: number) => {
		counterEcho.set((state) => ({
			history: state.history.filter((_, i) => i !== index)
		}));
	};

	// 在 Counter 组件中添加新的方法
	const deleteLastCount = () => {
		counterEcho.delete('count');
	};

	return (
		<div style={{
			padding: '2rem',
			maxWidth: '800px',
			margin: '0 auto',
			fontFamily: 'system-ui, -apple-system, sans-serif'
		}}>
			<h2 style={{
				fontSize: '1.8rem',
				color: '#2563eb',
				marginBottom: '1.5rem',
				textAlign: 'center'
			}}>Echo 计数器高级示例</h2>

			{/* 主计数器显示 */}
			<div style={{
				background: '#f8fafc',
				padding: '1.5rem',
				borderRadius: '0.5rem',
				boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
				marginBottom: '1.5rem'
			}}>
				<p style={{ fontSize: '1.5rem', fontWeight: '500', textAlign: 'center' }}>
					当前计数: <span style={{ color: '#2563eb' }}>{count}</span>
				</p>
				<p style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center' }}>
					最后更新: {new Date(lastUpdated).toLocaleString()}
				</p>
			</div>

			{/* 控制面板 */}
			<div style={{
				background: '#f1f5f9',
				padding: '1.5rem',
				borderRadius: '0.5rem',
				marginBottom: '1.5rem'
			}}>
				<h3 style={{ marginBottom: '1rem', color: '#334155' }}>控制面板</h3>

				{/* 步进值控制 */}
				<div style={{ marginBottom: '1rem' }}>
					<label style={{ display: 'block', marginBottom: '0.5rem' }}>
						步进值:
						<input
							type="number"
							value={step}
							onChange={(e) => updateStep(Number(e.target.value))}
							style={{
								marginLeft: '0.5rem',
								padding: '0.25rem',
								borderRadius: '0.25rem'
							}}
						/>
					</label>
				</div>

				{/* 自动增加开关 */}
				<div style={{ marginBottom: '1rem' }}>
					<label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<input
							type="checkbox"
							checked={autoIncrement}
							onChange={toggleAutoIncrement}
						/>
						自动增加 (每秒)
					</label>
				</div>

				{/* 操作按钮 */}
				<div style={{
					display: 'flex',
					gap: '0.75rem',
					justifyContent: 'center',
					marginTop: '1rem'
				}}>
					<button onClick={decrement} style={{
						padding: '0.5rem 1rem',
						background: '#ef4444',
						color: 'white',
						border: 'none',
						borderRadius: '0.375rem',
						cursor: 'pointer'
					}}>减少</button>
					<button onClick={increment} style={{
						padding: '0.5rem 1rem',
						background: '#2563eb',
						color: 'white',
						border: 'none',
						borderRadius: '0.375rem',
						cursor: 'pointer'
					}}>增加</button>
					<button onClick={reset} style={{
						padding: '0.5rem 1rem',
						background: '#64748b',
						color: 'white',
						border: 'none',
						borderRadius: '0.375rem',
						cursor: 'pointer'
					}}>重置</button>
					<button onClick={deleteLastCount} style={{
						padding: '0.5rem 1rem',
						background: '#9333ea',
						color: 'white',
						border: 'none',
						borderRadius: '0.375rem',
						cursor: 'pointer'
					}}>删除计数</button>
				</div>
			</div>

			{/* 历史记录 */}
			<div style={{
				background: '#f8fafc',
				padding: '1.5rem',
				borderRadius: '0.5rem',
				marginBottom: '1.5rem'
			}}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
					<h3 style={{ margin: 0, color: '#334155' }}>历史记录</h3>
					<button
						onClick={clearHistory}
						style={{
							padding: '0.25rem 0.75rem',
							background: '#dc2626',
							color: 'white',
							border: 'none',
							borderRadius: '0.25rem',
							cursor: 'pointer'
						}}
					>
						清除历史
					</button>
				</div>
				<div style={{
					maxHeight: '200px',
					overflowY: 'auto',
					padding: '0.5rem',
					background: 'white',
					borderRadius: '0.25rem'
				}}>
					{history.length === 0 ? (
						<p style={{ textAlign: 'center', color: '#94a3b8' }}>暂无历史记录</p>
					) : (
						<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
							{history.map((value, index) => (
								<li key={index} style={{
									padding: '0.5rem',
									borderBottom: '1px solid #e2e8f0',
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center'
								}}>
									<span>#{index + 1}: {value}</span>
									<button
										onClick={() => deleteHistoryItem(index)}
										style={{
											padding: '0.25rem 0.5rem',
											background: '#ef4444',
											color: 'white',
											border: 'none',
											borderRadius: '0.25rem',
											cursor: 'pointer',
											fontSize: '0.75rem'
										}}
									>
										删除
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			{/* 功能说明 */}
			<div style={{
				background: '#f8fafc',
				padding: '1.5rem',
				borderRadius: '0.5rem'
			}}>
				<h3 style={{ marginBottom: '1rem', color: '#334155' }}>功能演示</h3>
				<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
					{[
						'基础状态管理 - 计数器的增减和重置',
						'选择器功能 - 精确订阅状态的特定部分',
						'复杂状态 - 包含历史记录和设置',
						'自动操作 - 通过定时器自动更新状态',
						'本地存储 - 使用 IndexedDB 持久化数据',
						'跨窗口同步 - 在多个标签页间同步状态',
						'React Hooks 集成 - 响应式更新UI'
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

// 在组件外部使用示例
const exampleUsage = () => {
	// 订阅特定状态变化
	const unsubscribe = counterEcho.subscribe((state) => {
		if (state.count > 100) {
			console.log('计数器超过100!');
		}
	});

	// 直接修改状态
	counterEcho.set({ count: 10 });

	// 使用更新函数修改状态
	counterEcho.set(state => ({
		count: state.count * 2,
		history: [...state.history, state.count]
	}));

	// 取消订阅
	unsubscribe();
}; 