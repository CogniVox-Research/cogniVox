import typing


class _Managed[V]:
    def __init__(
        self,
        v: typing.Callable[
            [], typing.ContextManager[V] | typing.AsyncContextManager[V]
        ],
    ) -> None:
        self._init = v
        self._value: V | None = None
        self._manager: (
            typing.ContextManager[V] | typing.AsyncContextManager[V] | None
        ) = None

    async def __aenter__(self):
        self._manager = self._init()
        if isinstance(self._manager, typing.ContextManager):
            self._value = self._manager.__enter__()
        elif isinstance(self._manager, typing.AsyncContextManager):
            self._value = await self._manager.__aenter__()
        else:
            raise RuntimeError(f"Invalid value {self._manager}")

        return self

    async def __aexit__(self, *args: typing.Any):
        self._value = None

        if isinstance(self._manager, typing.ContextManager):
            self._manager.__exit__(*args)
        elif isinstance(self._manager, typing.AsyncContextManager):
            await self._manager.__aexit__(*args)

    def __getattribute__(self, name: str) -> typing.Any:
        if name.startswith("_"):
            return super().__getattribute__(name)
        if self._value is None:
            raise RuntimeError("Value not initialized")
        return getattr(self._value, name)


def lifespan_managed[T](
    v: typing.Callable[[], typing.AsyncContextManager[T] | typing.ContextManager[T]]
    | typing.Type[T],
) -> T:
    return _Managed(v)  # type: ignore
