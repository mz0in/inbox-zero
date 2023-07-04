import clsx from 'clsx';

export function Tag(props: { children: React.ReactNode; color?: 'green' | 'red' | 'white' }) {
  const { color = 'green' } = props;
  return (
    <div
      className={clsx(
        'rounded border-2 border-white px-2 py-0.5 text-center text-sm font-semibold shadow',
        {
          'bg-green-200 text-green-900': color === 'green',
          'bg-red-200 text-red-900': color === 'red',
          'bg-white text-gray-900': color === 'white',
        }
      )}
    >
      {props.children}
    </div>
  );
}
